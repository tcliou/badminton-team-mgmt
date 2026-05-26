-- =============================================================================
-- 0038_documents_module.sql
-- Documents Module
-- =============================================================================

create table if not exists public.documents (
    id                  uuid primary key default gen_random_uuid(),
    team_id             uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    title               text not null,
    description         text,
    url                 text not null,
    -- 可見對象 role id 陣列；空陣列代表「全員可見」
    visible_to_role_ids uuid[] not null default '{}'::uuid[],
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid references public.profiles(id) on delete set null
);

create index if not exists documents_team_idx on public.documents(team_id);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.trg_set_updated_at();

alter table public.documents enable row level security;

-- Insert permission
insert into public.permissions (key, category, description)
values ('action:documents:manage', 'action', '新增、編輯或刪除文件')
on conflict (key) do nothing;

-- Grant to admin by default
insert into public.role_permissions (role_id, permission_key)
values ('11111111-1111-1111-1111-111111111111', 'action:documents:manage')
on conflict do nothing;

-- Everyone can view if visible_to_role_ids is empty or if they have the role. Managers can view all.
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
  for select to authenticated
  using (
    public.has_permission(auth.uid(), 'action:documents:manage')
    or (
      array_length(visible_to_role_ids, 1) is null
      or exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role_id = any(visible_to_role_ids)
      )
    )
  );

drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents for all to authenticated
  using (public.has_permission(auth.uid(), 'action:documents:manage'))
  with check (public.has_permission(auth.uid(), 'action:documents:manage'));
