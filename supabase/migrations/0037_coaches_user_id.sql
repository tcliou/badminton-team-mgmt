-- 0037_coaches_user_id.sql

alter table public.coaches 
add column if not exists user_id uuid references public.profiles(id) on delete set null;
