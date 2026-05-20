-- =============================================================================
-- 0027_parent_rls.sql
-- Phase 2：家長角色 RLS 擴充
--
-- 策略：利用 player_parents 關聯表，讓家長可以代替綁定的小孩
--   (1) SELECT  自己小孩的請假、繳費紀錄、訓練出席
--   (2) INSERT  以自己小孩名義建立請假、繳費紀錄
--   (3) UPDATE  自己小孩 pending 中的請假、繳費紀錄
--   (4) DELETE  自己小孩 pending 中的請假、繳費紀錄
--   (5) SELECT  自己小孩的基本 profile（已可讀，確認不漏）
--
-- 輔助 function：is_parent_of(target_player_id)
--   判斷目前登入者是否為 target_player_id 的家長
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. 輔助函式：is_parent_of
-- ---------------------------------------------------------------------------
create or replace function public.is_parent_of(p_player_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from   public.player_parents
    where  parent_id = auth.uid()
      and  player_id = p_player_id
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. leave_requests（請假）
-- ---------------------------------------------------------------------------

-- 家長可以讀取自己小孩的請假紀錄
drop policy if exists leave_requests_parent_select on public.leave_requests;
create policy leave_requests_parent_select on public.leave_requests
  for select to authenticated
  using (public.is_parent_of(player_id));

-- 家長可以以小孩名義送出請假
drop policy if exists leave_requests_parent_insert on public.leave_requests;
create policy leave_requests_parent_insert on public.leave_requests
  for insert to authenticated
  with check (public.is_parent_of(player_id));

-- 家長可以修改小孩 pending 中的請假
drop policy if exists leave_requests_parent_update on public.leave_requests;
create policy leave_requests_parent_update on public.leave_requests
  for update to authenticated
  using (public.is_parent_of(player_id) and status = 'pending')
  with check (public.is_parent_of(player_id) and status = 'pending');

-- 家長可以刪除小孩 pending 中的請假
drop policy if exists leave_requests_parent_delete on public.leave_requests;
create policy leave_requests_parent_delete on public.leave_requests
  for delete to authenticated
  using (public.is_parent_of(player_id) and status = 'pending');

-- ---------------------------------------------------------------------------
-- 2. payment_records（繳費紀錄）
-- ---------------------------------------------------------------------------

-- 家長可以讀取自己小孩的繳費紀錄
drop policy if exists payment_records_parent_read on public.payment_records;
create policy payment_records_parent_read on public.payment_records
  for select to authenticated
  using (public.is_parent_of(player_id));

-- 家長可以以小孩名義登記繳費
drop policy if exists payment_records_parent_insert on public.payment_records;
create policy payment_records_parent_insert on public.payment_records
  for insert to authenticated
  with check (public.is_parent_of(player_id));

-- 家長可以修改小孩 pending 中的繳費（例如補傳收據）
drop policy if exists payment_records_parent_update on public.payment_records;
create policy payment_records_parent_update on public.payment_records
  for update to authenticated
  using (public.is_parent_of(player_id) and status = 'pending')
  with check (public.is_parent_of(player_id) and status = 'pending');

-- 家長可以刪除小孩 pending 中的繳費紀錄
drop policy if exists payment_records_parent_delete on public.payment_records;
create policy payment_records_parent_delete on public.payment_records
  for delete to authenticated
  using (public.is_parent_of(player_id) and status = 'pending');

-- ---------------------------------------------------------------------------
-- 3. attendance_records（訓練出席）
-- ---------------------------------------------------------------------------
-- 家長可以讀取自己小孩的出席紀錄（attendance 目前對所有人開放 select，無需再加）
-- 確認：attendance_select policy 為 using(true)，家長自然包含在內，不需額外處理。

-- ---------------------------------------------------------------------------
-- 4. profiles（個人資料）
-- ---------------------------------------------------------------------------
-- 現有的 profiles SELECT policy 已讓所有登入者讀取（參考 0001_init_auth_acl.sql）。
-- 家長更新小孩的 profile（由 players:manage 控制）屬於 Phase 3 的討論範疇，
-- 目前保持不動，避免過度開放寫入。
