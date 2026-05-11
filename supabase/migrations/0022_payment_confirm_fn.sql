-- =============================================================================
-- 0022_payment_confirm_fn.sql
-- 原子化「對帳」函式：finance 確認某筆 payment_record 為 confirmed 同時，
-- 自動寫一筆 income 的 finance_transaction 並把兩者 linked_payment_record_id 串起。
--
-- 為什麼要 function：兩段 update + insert 必須同進同退，否則對帳出錯時很難追。
-- 用 security definer 是為了 update payment_records 後 RLS 仍允許 insert 到
-- finance_transactions（兩個表權限相同，但 SECURITY DEFINER 確保走的是 function
-- owner 的權限，而不是 caller 的，可以避免 RLS 推導順序的邊角狀況）。
-- =============================================================================

create or replace function public.confirm_payment(
  p_record_id uuid,
  p_note      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller   uuid := auth.uid();
  v_record   public.payment_records;
  v_item     public.payment_items;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  -- 必須具備對帳權限（DEFINER 模式下 RLS 不會自動擋，要手動檢查）
  if not public.has_permission(v_caller, 'action:finance:confirm') then
    raise exception 'permission denied: action:finance:confirm';
  end if;

  select * into v_record from public.payment_records where id = p_record_id;
  if not found then
    raise exception 'payment_record not found: %', p_record_id;
  end if;
  if v_record.status <> 'pending' then
    raise exception 'payment_record is not pending (status=%)', v_record.status;
  end if;

  select * into v_item from public.payment_items where id = v_record.item_id;

  -- 1. 標記為已收
  update public.payment_records
     set status       = 'confirmed',
         confirmed_by = v_caller,
         confirmed_at = now(),
         note         = coalesce(p_note, note)
   where id = p_record_id;

  -- 2. 寫入收支總帳（income）
  insert into public.finance_transactions
    (direction, occurred_on, category, item, amount,
     linked_payment_record_id, created_by)
  values
    ('income', v_record.paid_at::date, '繳費收入', v_item.name, v_record.amount,
     p_record_id, v_caller);
end;
$$;

revoke all on function public.confirm_payment(uuid, text) from public;
grant execute on function public.confirm_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 退回：把 record 標 rejected 即可，不寫入總帳
-- ---------------------------------------------------------------------------
create or replace function public.reject_payment(
  p_record_id uuid,
  p_note      text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_record public.payment_records;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;
  if not public.has_permission(v_caller, 'action:finance:confirm') then
    raise exception 'permission denied: action:finance:confirm';
  end if;
  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'rejection note is required';
  end if;

  select * into v_record from public.payment_records where id = p_record_id;
  if not found then
    raise exception 'payment_record not found: %', p_record_id;
  end if;
  if v_record.status <> 'pending' then
    raise exception 'payment_record is not pending (status=%)', v_record.status;
  end if;

  update public.payment_records
     set status       = 'rejected',
         confirmed_by = v_caller,
         confirmed_at = now(),
         note         = p_note
   where id = p_record_id;
end;
$$;

revoke all on function public.reject_payment(uuid, text) from public;
grant execute on function public.reject_payment(uuid, text) to authenticated;
