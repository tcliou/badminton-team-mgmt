-- =============================================================================
-- 新增使用者範本
--
-- 在 P3-7 權限後台完成之前，新增帳號需手動兩步驟：
--   1. Supabase Dashboard → Authentication → Users → Add user
--      Email: <username>@team.local   ← 必須對應 VITE_SYNTHETIC_EMAIL_DOMAIN
--      Password: 自訂
--      勾「Auto Confirm User」
--   2. 在 SQL Editor 跑下面這段（替換最上面 4 個 \set 變數）
--
-- 系統角色 UUID（不要改）：
--   admin   11111111-1111-1111-1111-111111111111
--   coach   22222222-2222-2222-2222-222222222222
--   finance 33333333-3333-3333-3333-333333333333
--   player  44444444-4444-4444-4444-444444444444
-- =============================================================================

do $$
declare
  -- ↓↓↓ 修改這 4 個變數 ↓↓↓
  v_username     text := 'alice';            -- 對外的登入 username
  v_email        text := 'alice@team.local'; -- 必須跟 Dashboard 建的一致
  v_display_name text := '王小美';            -- 顯示名稱
  v_role_id      uuid := '44444444-4444-4444-4444-444444444444'; -- 預設 player
  -- ↑↑↑ 修改這 4 個變數 ↑↑↑

  v_uid uuid;
begin
  -- 從 auth.users 撈出對應的 user id
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception '❌ 找不到 auth.users 內的 % — 請先到 Dashboard → Authentication → Users 建立', v_email;
  end if;

  -- 建立 profile（已存在就更新顯示資訊）
  insert into public.profiles (id, username, display_name, must_change_password)
  values (v_uid, v_username, v_display_name, true)
  on conflict (id) do update
  set username = excluded.username,
      display_name = excluded.display_name;

  -- 指派角色（重複指派同角色不會出錯）
  insert into public.user_roles (user_id, role_id)
  values (v_uid, v_role_id)
  on conflict do nothing;

  raise notice '✅ 已建立 username=% display_name=% user_id=%', v_username, v_display_name, v_uid;
end $$;
