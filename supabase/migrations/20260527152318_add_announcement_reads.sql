create table public.announcement_reads (
    announcement_id uuid references public.announcements(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    read_at timestamp with time zone default now() not null,
    primary key (announcement_id, user_id)
);

alter table public.announcement_reads enable row level security;

create policy "Users can record their own reads" 
    on public.announcement_reads 
    for insert 
    with check (auth.uid() = user_id);

create policy "Users can see reads" 
    on public.announcement_reads 
    for select 
    using (true);

-- Enable realtime so UI could potentially update (optional but good practice)
alter publication supabase_realtime add table public.announcement_reads;
