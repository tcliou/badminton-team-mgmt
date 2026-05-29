-- 1. 新增 announcements bucket
insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do update set public = true;

-- 2. 設定 announcements bucket RLS
-- 所有人可讀取
drop policy if exists "announcements: public read" on storage.objects;
create policy "announcements: public read"
on storage.objects for select
to public
using (bucket_id = 'announcements');

-- 有管理權限者可上傳 (Role 包含 Admin / Coach / 某些 manager)
-- 由於我們有 `core_has_permission(auth.uid(), 'action:announcements:manage')`，
-- 這邊我們可以利用這個函式。
drop policy if exists "announcements: manager upload" on storage.objects;
create policy "announcements: manager upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'announcements'
  and public.has_permission(auth.uid(), 'action:announcements:manage')
);

drop policy if exists "announcements: manager update" on storage.objects;
create policy "announcements: manager update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'announcements'
  and public.has_permission(auth.uid(), 'action:announcements:manage')
);

drop policy if exists "announcements: manager delete" on storage.objects;
create policy "announcements: manager delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'announcements'
  and public.has_permission(auth.uid(), 'action:announcements:manage')
);

-- 3. 修改 announcements 表格，加入 image_urls
alter table public.announcements 
add column if not exists image_urls text[] not null default '{}';
