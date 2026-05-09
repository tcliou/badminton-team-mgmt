-- =============================================================================
-- 0003_create_admin_user.sql
-- 建立第一個 admin 帳號（請於部署後立即改密碼）
--
-- 使用方式：
--   1. 在 Supabase Dashboard → SQL Editor 執行此檔案前，
--      請先到 Authentication → Users 點 "Invite user" 或 "Add user"，
--      使用 email = `admin@team.local`、自訂初始密碼，建立 auth.users 紀錄。
--   2. 取得 Auth UI 顯示的 user UUID。
--   3. 將下方 :ADMIN_USER_ID 替換為該 UUID 後，執行此檔案。
--
-- 為避免一次性腳本誤插，本檔以 DO BLOCK 包覆，找不到 admin user 會略過。
-- =============================================================================

do $$
declare
    v_admin_uid uuid;
begin
    -- 嘗試從 auth.users 撈出 admin@team.local 的 UUID
    select id into v_admin_uid
    from auth.users
    where email = 'admin@team.local'
    limit 1;

    if v_admin_uid is null then
        raise notice '找不到 email = admin@team.local 的 auth.users，請先在 Dashboard 建立';
        return;
    end if;

    -- 建立 profile（如尚未存在）
    insert into public.profiles (id, username, display_name, must_change_password, created_by)
    values (v_admin_uid, 'admin', '系統管理員', true, v_admin_uid)
    on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name;

    -- 指派 admin 角色
    insert into public.user_roles (user_id, role_id, granted_by)
    values (v_admin_uid, '11111111-1111-1111-1111-111111111111', v_admin_uid)
    on conflict do nothing;

    raise notice '✅ Admin profile + role 已建立，user_id = %', v_admin_uid;
end $$;
