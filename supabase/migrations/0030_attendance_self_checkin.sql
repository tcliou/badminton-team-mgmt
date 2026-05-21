-- =============================================================================
-- 0030_attendance_self_checkin.sql
-- 球員自助打卡 RLS 政策
--
-- 原本 attendance_write 只允許 action:training:attendance（教練）。
-- 現在補充：球員可以 INSERT/UPDATE 自己的出席紀錄，
--   但只能標記 'present' 或 'late'（不能自己標 absent/on_leave）。
-- 教練仍可用原本的 attendance_write policy 覆蓋任意球員的任意狀態。
-- =============================================================================

-- 球員自助打卡：INSERT 自己的紀錄
drop policy if exists attendance_self_insert on public.attendance_records;
create policy attendance_self_insert on public.attendance_records
  for insert to authenticated
  with check (
    player_id = auth.uid()
    and status in ('present', 'late')
  );

-- 球員自助打卡：UPDATE 自己的紀錄（同樣限制狀態）
drop policy if exists attendance_self_update on public.attendance_records;
create policy attendance_self_update on public.attendance_records
  for update to authenticated
  using (player_id = auth.uid())
  with check (
    player_id = auth.uid()
    and status in ('present', 'late')
  );
