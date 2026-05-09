-- =============================================================================
-- 0001_init_auth_acl.sql
-- Phase 1：認證與權限控管基礎結構
--   - profiles      球員主資料（對應 auth.users）
--   - roles         角色（admin / coach / finance / player + 自訂）
--   - permissions   權限鍵（page:* / action:*）
--   - role_permissions / user_roles  M:N 對應
--   - has_permission(uuid, text)     RLS 共用 helper
-- =============================================================================

-- 啟用必要的擴充
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    team_id         uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    username        text not null unique,
    display_name    text not null,
    email           text,
    phone           text,
    avatar_url      text,
    birthday        date,
    dominant_hand   text check (dominant_hand in ('left','right','both')),
    height_cm       integer,
    weight_kg       numeric(5,2),
    favorite_racket text,
    extra_info      jsonb not null default '{}'::jsonb,
    must_change_password boolean not null default true,
    status          text not null default 'active' check (status in ('active','suspended')),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    created_by      uuid
);

create index if not exists profiles_team_idx on public.profiles(team_id);
create index if not exists profiles_status_idx on public.profiles(status);

-- ---------------------------------------------------------------------------
-- roles / permissions
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
    id          uuid primary key default uuid_generate_v4(),
    name        text not null unique,
    description text,
    is_system   boolean not null default false,
    created_at  timestamptz not null default now()
);

create table if not exists public.permissions (
    key         text primary key,
    description text not null,
    category    text not null check (category in ('page','action'))
);

create table if not exists public.role_permissions (
    role_id        uuid not null references public.roles(id) on delete cascade,
    permission_key text not null references public.permissions(key) on delete cascade,
    primary key (role_id, permission_key)
);

create table if not exists public.user_roles (
    user_id    uuid not null references public.profiles(id) on delete cascade,
    role_id    uuid not null references public.roles(id) on delete cascade,
    granted_at timestamptz not null default now(),
    granted_by uuid,
    primary key (user_id, role_id)
);

create index if not exists user_roles_role_idx on public.user_roles(role_id);

-- ---------------------------------------------------------------------------
-- helper：判斷某 user 是否擁有某權限鍵
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(p_user_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles ur
        join public.role_permissions rp on rp.role_id = ur.role_id
        where ur.user_id = p_user_id
          and rp.permission_key = p_key
    );
$$;

revoke all on function public.has_permission(uuid, text) from public;
grant execute on function public.has_permission(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- helper：取得登入者的所有權限鍵（前端 useAuth 一次拉回）
-- ---------------------------------------------------------------------------
create or replace function public.current_user_permissions()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
    select distinct rp.permission_key
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = auth.uid();
$$;

grant execute on function public.current_user_permissions() to authenticated;

-- ---------------------------------------------------------------------------
-- view：登入者的 profile + roles + permissions
-- 用於前端登入後一次取回完整的會話狀態
-- ---------------------------------------------------------------------------
create or replace view public.v_my_profile
with (security_invoker = true) as
select
    p.*,
    coalesce(
        (select array_agg(r.name order by r.name)
         from public.user_roles ur
         join public.roles r on r.id = ur.role_id
         where ur.user_id = p.id),
        array[]::text[]
    )                                                          as role_names,
    coalesce(
        (select array_agg(distinct rp.permission_key)
         from public.user_roles ur
         join public.role_permissions rp on rp.role_id = ur.role_id
         where ur.user_id = p.id),
        array[]::text[]
    )                                                          as permission_keys
from public.profiles p
where p.id = auth.uid();

-- ---------------------------------------------------------------------------
-- updated_at 自動更新 trigger
-- ---------------------------------------------------------------------------
create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles       enable row level security;

-- profiles：本人讀寫自己；任何登入者讀別人的「公開資訊」（用 view 過濾欄位）；
-- admin 全寫。
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
on public.profiles for select
to authenticated
using (true);  -- 欄位級隱私由前端 view 控制；目前列級不擋讀

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
on public.profiles for all
to authenticated
using (public.has_permission(auth.uid(), 'action:users:manage'))
with check (public.has_permission(auth.uid(), 'action:users:manage'));

-- roles / permissions / mapping：所有登入者可讀（UI 顯示用）；
-- 管理者才能寫
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles for select to authenticated using (true);

drop policy if exists roles_admin_write on public.roles;
create policy roles_admin_write on public.roles for all to authenticated
using (public.has_permission(auth.uid(), 'action:roles:manage'))
with check (public.has_permission(auth.uid(), 'action:roles:manage'));

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions for select to authenticated using (true);

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions for select to authenticated using (true);

drop policy if exists role_permissions_admin_write on public.role_permissions;
create policy role_permissions_admin_write on public.role_permissions for all to authenticated
using (public.has_permission(auth.uid(), 'action:roles:manage'))
with check (public.has_permission(auth.uid(), 'action:roles:manage'));

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated using (true);

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles for all to authenticated
using (public.has_permission(auth.uid(), 'action:users:manage'))
with check (public.has_permission(auth.uid(), 'action:users:manage'));
