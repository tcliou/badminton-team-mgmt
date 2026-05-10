-- =============================================================================
-- 0011_storage_avatars.sql
-- 球員頭像 Storage bucket
--   - bucket id: 'avatars'，public read，僅本人或管理者可寫
--   - 每位球員的檔案路徑為 `${user_id}/${filename}`，方便用 RLS 比對 owner
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,    -- 公開讀（同隊成員可看頭像）
  2097152, -- 2 MiB 上限
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage RLS：套在 storage.objects 表
-- ---------------------------------------------------------------------------
-- 所有人可讀（bucket 已 public，但保險起見也明確寫 policy）
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- 本人可上傳/覆蓋自己路徑下的檔案
drop policy if exists "avatars: owner upload" on storage.objects;
create policy "avatars: owner upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 具 players:manage 權限者可任意改（教練幫忙換頭像）
drop policy if exists "avatars: manager all" on storage.objects;
create policy "avatars: manager all"
on storage.objects for all
to authenticated
using (
  bucket_id = 'avatars'
  and public.has_permission(auth.uid(), 'action:players:manage')
)
with check (
  bucket_id = 'avatars'
  and public.has_permission(auth.uid(), 'action:players:manage')
);
