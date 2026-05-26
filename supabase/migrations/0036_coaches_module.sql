-- 0036_coaches_module.sql

create table if not exists public.coaches (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    title       text,
    cv          text,
    avatar_url  text,
    is_active   boolean not null default true,
    user_id     uuid references public.profiles(id) on delete set null,
    created_at  timestamp with time zone not null default now(),
    updated_at  timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.coaches enable row level security;

-- Policies
create policy "coaches_select"
    on public.coaches for select
    to authenticated
    using (true);

create policy "coaches_insert"
    on public.coaches for insert
    to authenticated
    with check (public.has_permission(auth.uid(), 'action:coaches:manage'));

create policy "coaches_update"
    on public.coaches for update
    to authenticated
    using (public.has_permission(auth.uid(), 'action:coaches:manage'));

create policy "coaches_delete"
    on public.coaches for delete
    to authenticated
    using (public.has_permission(auth.uid(), 'action:coaches:manage'));

-- Trigger for updated_at
create trigger trg_coaches_updated_at
    before update on public.coaches
    for each row
    execute function public.trg_set_updated_at();

-- Add permission key
insert into public.permissions (key, description, category)
values ('action:coaches:manage', '管理教練介紹與CV', 'action')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_key)
select id, 'action:coaches:manage' from public.roles where name = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select id, 'action:coaches:manage' from public.roles where name = 'coach'
on conflict do nothing;
