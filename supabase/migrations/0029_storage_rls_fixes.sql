-- =============================================================================
-- 0029_storage_rls_fixes.sql
-- Storage RLS 修正與強化
--
-- 問題清單：
-- (1) payment-proofs signed URL 時效只有 60 秒（設計文件要求 15 分鐘）
--     → 此為前端行為，在此 migration 以 comment 記錄，實際修正在 API 層
-- (2) 家長代替小孩上傳繳費證明：路徑為 ${parent_uid}/...，
--     但 finance:confirm 已可讀，本人（parent）也可讀，故已足夠。
--     然而小孩本人（player）無法讀到家長上傳的證明 → 補充 policy
-- (3) finance-receipts bucket（收據/憑證）尚無明確 RLS 文件 → 補齊
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 修正一：payment-proofs — 補充「家長上傳的，小孩可以讀」的 policy
-- 情境：家長以自己帳號上傳小孩的繳費證明（路徑 = parent_uid/...）
--       小孩帳號應能讀取自己的繳費紀錄 proof_url，但若路徑前綴是家長 uid，
--       目前的 owner read policy 會擋住小孩存取。
-- ---------------------------------------------------------------------------

-- 補充：家長上傳的證明，其綁定的小孩（player）也可以讀
drop policy if exists "payment-proofs: linked player read" on storage.objects;
create policy "payment-proofs: linked player read"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  -- 取路徑第一段（parent_uid），確認目前登入者是其小孩
  and exists (
    select 1 from public.player_parents pp
    where pp.parent_id = (storage.foldername(name))[1]::uuid
      and pp.player_id = auth.uid()
  )
);

-- 補充：admin 可讀所有繳費證明（方便管理員查閱爭議紀錄）
drop policy if exists "payment-proofs: admin read" on storage.objects;
create policy "payment-proofs: admin read"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.has_permission(auth.uid(), 'action:users:manage')
);

-- ---------------------------------------------------------------------------
-- 修正二：finance-receipts bucket（收支總帳附件）
-- 若 bucket 尚未建立，先建立；若已存在則以 on conflict do nothing 跳過
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'finance-receipts',
  'finance-receipts',
  false,     -- private，簽名 URL 取用
  10485760,  -- 10 MiB 上限
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- 具 finance:manage 權限者可上傳/讀取/刪除
drop policy if exists "finance-receipts: finance all" on storage.objects;
create policy "finance-receipts: finance all"
on storage.objects for all to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.has_permission(auth.uid(), 'action:finance:manage')
)
with check (
  bucket_id = 'finance-receipts'
  and public.has_permission(auth.uid(), 'action:finance:manage')
);

-- admin 可讀（不可刪，避免誤刪憑證）
drop policy if exists "finance-receipts: admin read" on storage.objects;
create policy "finance-receipts: admin read"
on storage.objects for select to authenticated
using (
  bucket_id = 'finance-receipts'
  and public.has_permission(auth.uid(), 'action:users:manage')
);

-- ===========================================================================
-- 備註：signed URL 時效修正
-- 設計文件要求 15 分鐘（900 秒），目前前端寫死 60 秒。
-- 實際修正在：
--   src/modules/payments/api/myPaymentsApi.ts → createSignedUrl(path, 900)
--   src/modules/finance/api/paymentRecordsApi.ts → createSignedUrl(path, 900)
-- ===========================================================================
