-- =============================================================================
-- 0040_calendar_module.sql
-- 加入日曆模組的獨立權限
-- =============================================================================

insert into public.permissions (key, description, category)
values ('page:calendar:view', '檢視日曆頁面', 'page')
on conflict do nothing;

-- 將權限預設發給原本就看得到首頁行事曆的角色 (包含 admin, coach, finance, player)
insert into public.role_permissions (role_id, permission_key)
values 
  ('11111111-1111-1111-1111-111111111111', 'page:calendar:view'),
  ('22222222-2222-2222-2222-222222222222', 'page:calendar:view'),
  ('33333333-3333-3333-3333-333333333333', 'page:calendar:view'),
  ('44444444-4444-4444-4444-444444444444', 'page:calendar:view')
on conflict do nothing;
