-- =============================================================================
-- 0028_audit_logs.sql
-- Audit Log 系統
--
-- 目的：記錄 profiles 表的每一次 UPDATE，追蹤誰在何時改了什麼欄位。
-- 設計原則：
--   - audit_logs 表只可 INSERT（觸發器寫入），任何人不可 UPDATE/DELETE
--   - SELECT 只開放給 admin
--   - 使用 JSONB 記錄變更前後的值，僅記錄有差異的欄位
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. audit_logs 資料表
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  -- 事件資訊
  action       text not null,                    -- 'UPDATE', 'INSERT', 'DELETE'
  table_name   text not null,                    -- 觸發的資料表
  record_id    uuid not null,                    -- 被異動的紀錄 PK
  -- 異動內容
  old_values   jsonb,                            -- 變更前的欄位值（UPDATE/DELETE 才有）
  new_values   jsonb,                            -- 變更後的欄位值（INSERT/UPDATE 才有）
  changed_keys text[],                           -- 有差異的欄位名稱陣列
  -- 操作者
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_ip     inet,                             -- 來源 IP（由 request.headers 取得）
  -- 時間
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_table_record_idx
  on public.audit_logs (table_name, record_id);

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

comment on table public.audit_logs is
  '系統稽核紀錄：記錄 profiles 等敏感資料表的每次變更，供管理員審查';

-- ---------------------------------------------------------------------------
-- 2. RLS 設定
--    - 只有 admin 可以讀
--    - 任何人（包含 authenticated）都不可手動寫入（只由 trigger 以 security definer 寫）
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select
on public.audit_logs for select
to authenticated
using (public.has_permission(auth.uid(), 'action:users:manage'));

-- 不開放任何角色 INSERT/UPDATE/DELETE（觸發器走 security definer 繞過 RLS）

-- ---------------------------------------------------------------------------
-- 3. 觸發器函式：記錄 profiles 的 UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.trg_audit_profiles()
returns trigger
language plpgsql
security definer  -- 以函式擁有者身份執行，繞過 RLS 直接寫 audit_logs
set search_path = public
as $$
declare
  v_old   jsonb;
  v_new   jsonb;
  v_diff  jsonb;
  v_keys  text[];
  v_key   text;
begin
  -- 只在真正有欄位改變時才記錄（排除 updated_at 自動更新）
  v_old := to_jsonb(old) - 'updated_at';
  v_new := to_jsonb(new) - 'updated_at';

  -- 找出有差異的 key
  v_diff := jsonb_object_agg(key, value)
    filter (where value is distinct from v_old -> key)
    from jsonb_each(v_new) as t(key, value);

  -- 若沒有實質差異就跳過
  if v_diff is null or v_diff = '{}'::jsonb then
    return new;
  end if;

  -- 收集有差異的 key 名稱
  select array_agg(k order by k)
  into v_keys
  from jsonb_object_keys(v_diff) as k;

  insert into public.audit_logs (
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    changed_keys,
    actor_id,
    actor_ip
  ) values (
    'UPDATE',
    tg_table_name,
    new.id,
    -- 只保留有差異的舊值
    (select jsonb_object_agg(k, v_old -> k) from unnest(v_keys) k),
    v_diff,
    v_keys,
    -- 嘗試取得目前登入者的 uid（Edge Function 或 RLS context 下有效）
    nullif(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    -- 嘗試取得 IP（Supabase 在 request 標頭注入）
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-real-ip', '')::inet
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. 在 profiles 掛上 AFTER UPDATE trigger
-- ---------------------------------------------------------------------------
drop trigger if exists audit_profiles_update on public.profiles;
create trigger audit_profiles_update
after update on public.profiles
for each row execute function public.trg_audit_profiles();

-- ---------------------------------------------------------------------------
-- 5. 開放 admin 查詢用的輔助 view（方便閱讀，欄位已對齊中文需求）
-- ---------------------------------------------------------------------------
create or replace view public.v_audit_logs with (security_invoker = true) as
select
  al.id,
  al.action,
  al.table_name,
  al.record_id,
  al.old_values,
  al.new_values,
  al.changed_keys,
  al.created_at,
  -- 操作者資訊
  p.username   as actor_username,
  p.display_name as actor_display_name,
  al.actor_ip
from public.audit_logs al
left join public.profiles p on p.id = al.actor_id;
