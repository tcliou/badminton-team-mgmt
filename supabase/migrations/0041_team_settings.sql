-- =============================================================================
-- 0041_team_settings.sql
-- 建立 team_settings 資料表供管理員設定導覽列順序
-- =============================================================================

create table if not exists public.team_settings (
    team_id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
    nav_order text[] not null default '{}'::text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 自動更新時間
drop trigger if exists team_settings_set_updated_at on public.team_settings;
create trigger team_settings_set_updated_at
before update on public.team_settings
for each row execute function public.trg_set_updated_at();

alter table public.team_settings enable row level security;

-- 新增權限：action:settings:manage
insert into public.permissions (key, category, description)
values ('action:settings:manage', 'action', '系統設定管理')
on conflict (key) do nothing;

-- 將權限賦予預設 admin (11111111-1111-1111-1111-111111111111)
insert into public.role_permissions (role_id, permission_key)
values ('11111111-1111-1111-1111-111111111111', 'action:settings:manage')
on conflict do nothing;

-- 任何人登入皆可讀取設定 (以供導覽列渲染)
drop policy if exists team_settings_read on public.team_settings;
create policy team_settings_read on public.team_settings
  for select to authenticated
  using (true);

-- 僅有設定權限者可以修改/新增
drop policy if exists team_settings_write on public.team_settings;
create policy team_settings_write on public.team_settings
  for all to authenticated
  using (public.has_permission(auth.uid(), 'action:settings:manage'))
  with check (public.has_permission(auth.uid(), 'action:settings:manage'));

-- 寫入一筆預設資料
insert into public.team_settings (team_id, nav_order)
values ('00000000-0000-0000-0000-000000000001', '{}')
on conflict (team_id) do nothing;
