-- =============================================================================
-- 0032_training_enrollments.sql
-- =============================================================================

create table if not exists public.training_enrollment_forms (
    id          uuid primary key default gen_random_uuid(),
    title       text not null,
    dates       jsonb not null default '[]'::jsonb,
    status      text not null default 'draft' check (status in ('draft','published','closed')),
    created_by  uuid references public.profiles(id),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table if not exists public.training_enrollment_rows (
    id              uuid primary key default gen_random_uuid(),
    form_id         uuid not null references public.training_enrollment_forms(id) on delete cascade,
    player_id       uuid not null references public.profiles(id) on delete cascade,
    enrollment_type text,
    date_records    jsonb not null default '{}'::jsonb,
    note            text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique(form_id, player_id)
);

create trigger forms_set_updated_at before update on public.training_enrollment_forms for each row execute function public.trg_set_updated_at();
create trigger rows_set_updated_at before update on public.training_enrollment_rows for each row execute function public.trg_set_updated_at();

alter table public.training_enrollment_forms enable row level security;
alter table public.training_enrollment_rows enable row level security;

-- =============================================================================
-- RLS Policies: Forms
-- =============================================================================
drop policy if exists forms_select on public.training_enrollment_forms;
create policy forms_select on public.training_enrollment_forms for select to authenticated using (true);

drop policy if exists forms_insert on public.training_enrollment_forms;
create policy forms_insert on public.training_enrollment_forms for insert to authenticated 
with check (public.has_permission(auth.uid(), 'action:training:manage'));

drop policy if exists forms_update on public.training_enrollment_forms;
create policy forms_update on public.training_enrollment_forms for update to authenticated 
using (public.has_permission(auth.uid(), 'action:training:manage')) 
with check (public.has_permission(auth.uid(), 'action:training:manage'));

drop policy if exists forms_delete on public.training_enrollment_forms;
create policy forms_delete on public.training_enrollment_forms for delete to authenticated 
using (public.has_permission(auth.uid(), 'action:training:manage'));

-- =============================================================================
-- RLS Policies: Rows
-- =============================================================================
drop policy if exists rows_select on public.training_enrollment_rows;
create policy rows_select on public.training_enrollment_rows for select to authenticated using (true);

drop policy if exists rows_insert on public.training_enrollment_rows;
create policy rows_insert on public.training_enrollment_rows for insert to authenticated 
with check (public.has_permission(auth.uid(), 'action:training:manage'));

drop policy if exists rows_delete on public.training_enrollment_rows;
create policy rows_delete on public.training_enrollment_rows for delete to authenticated 
using (public.has_permission(auth.uid(), 'action:training:manage'));

drop policy if exists rows_update on public.training_enrollment_rows;
create policy rows_update on public.training_enrollment_rows for update to authenticated
using (
    public.has_permission(auth.uid(), 'action:training:manage')
    or player_id = auth.uid()
    or public.is_parent_of(player_id)
)
with check (
    public.has_permission(auth.uid(), 'action:training:manage')
    or player_id = auth.uid()
    or public.is_parent_of(player_id)
);

-- =============================================================================
-- Trigger: Date restriction check for Non-Admins updating cell data
-- =============================================================================
create or replace function public.trg_enrollment_rows_update_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_is_admin boolean;
    v_key text;
    v_val jsonb;
    v_current_date date;
begin
    -- Check if user is admin
    v_is_admin := public.has_permission(auth.uid(), 'action:training:manage');

    -- Admin is unrestricted
    if v_is_admin then
        return new;
    end if;

    -- Current date in team's timezone (using UTC+8 as default for now, can be adjusted)
    v_current_date := (now() at time zone 'Asia/Taipei')::date;

    -- Check new/modified date keys
    for v_key, v_val in select * from jsonb_each(new.date_records) loop
        if coalesce(old.date_records->v_key, 'null'::jsonb) != v_val then
            -- Value changed, check date
            if v_key::date < v_current_date then
                raise exception 'Permission denied: Cannot edit past dates (%)', v_key;
            end if;
        end if;
    end loop;

    -- Check deleted date keys (key existed in old, but not in new)
    for v_key, v_val in select * from jsonb_each(old.date_records) loop
        if not (new.date_records ? v_key) then
            if v_key::date < v_current_date then
                raise exception 'Permission denied: Cannot delete past dates (%)', v_key;
            end if;
        end if;
    end loop;

    return new;
end;
$$;

drop trigger if exists trg_enrollment_rows_update_check on public.training_enrollment_rows;
create trigger trg_enrollment_rows_update_check
before update on public.training_enrollment_rows
for each row execute function public.trg_enrollment_rows_update_check();
