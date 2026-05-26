-- =============================================================================
-- 0039_grant_documents_manage.sql
-- 補上給予 admin 角色管理文件的權限 (因為 0038 已經在 prod 被執行過了，supabase db push 不會重跑)
-- =============================================================================

insert into public.role_permissions (role_id, permission_key)
values ('11111111-1111-1111-1111-111111111111', 'action:documents:manage')
on conflict do nothing;
