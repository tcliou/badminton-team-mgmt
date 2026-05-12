-- =============================================================================
-- supabase/migrations/0004_e2e_test_accounts.sql
-- 本機 E2E 測試前置設定
--
-- ⚠️  player1 帳號由 Playwright globalSetup (e2e/global-setup.ts) 透過
--    Supabase Admin SDK 建立，此處不再直接 INSERT auth.users（避免
--    繞過 GoTrue 造成 Dashboard 無法刪除的問題）。
--
-- 此 migration 只做：
--   1. 確保 admin@team.local 的 must_change_password = false
--      （避免 E2E 登入後被強制改密碼頁攔截）
-- =============================================================================

do $$
declare
    v_admin_uid uuid;
begin
    select id into v_admin_uid
    from auth.users
    where email = 'admin@team.local'
    limit 1;

    if v_admin_uid is null then
        raise notice '找不到 admin@team.local，請先執行 0003_create_admin_user.sql';
        return;
    end if;

    update public.profiles
    set must_change_password = false
    where id = v_admin_uid;

    raise notice '✅ admin must_change_password 已設為 false（供 E2E 測試使用）';
end $$;
