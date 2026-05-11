-- =============================================================================
-- 0021_storage_payment_proofs.sql
-- 繳費證明 Storage bucket
--   - bucket id: 'payment-proofs'，private（不公開讀），signed URL 取用
--   - 球員上傳到 ${user_id}/${filename}
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,    -- 不公開讀
  5242880,  -- 5 MiB 上限
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 政策：本人寫自己路徑下的；本人或 finance:confirm 可讀
-- ---------------------------------------------------------------------------
drop policy if exists "payment-proofs: owner upload" on storage.objects;
create policy "payment-proofs: owner upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "payment-proofs: owner read" on storage.objects;
create policy "payment-proofs: owner read"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_permission(auth.uid(), 'action:finance:confirm')
  )
);

drop policy if exists "payment-proofs: owner delete" on storage.objects;
create policy "payment-proofs: owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
