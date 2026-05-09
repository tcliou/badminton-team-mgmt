-- =============================================================================
-- 0002_seed_permissions_roles.sql
-- 預設 4 個系統角色與所有 Phase 1–4 規劃的 permission key
-- 之後 Admin 可在後台增刪角色與權限對應，但此處的 system role 不可刪
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 預設權限鍵
-- ---------------------------------------------------------------------------
insert into public.permissions (key, description, category) values
  -- 頁面
  ('page:home:view',           '檢視首頁（公告、行事曆）', 'page'),
  ('page:players:view',        '檢視球員管理頁',           'page'),
  ('page:players:edit',        '編輯任意球員資料',         'page'),
  ('page:leaves:view',         '檢視請假頁',               'page'),
  ('page:payments:view',       '檢視繳費登記頁',           'page'),
  ('page:announcements:view',  '檢視公告管理頁',           'page'),
  ('page:finance:view',        '檢視財務與出納頁',         'page'),
  ('page:training:view',       '檢視訓練時間管理頁',       'page'),
  ('page:admin:view',          '檢視管理後台',             'page'),

  -- 動作
  ('action:users:manage',      '建立 / 停用 / 修改使用者帳號', 'action'),
  ('action:roles:manage',      '建立 / 修改角色與權限',         'action'),
  ('action:announcements:manage', '建立 / 修改 / 刪除公告',     'action'),
  ('action:training:manage',   '建立 / 修改訓練時間',           'action'),
  ('action:training:attendance', '記錄訓練出席',                'action'),
  ('action:leaves:approve',    '審核請假',                      'action'),
  ('action:finance:manage',    '管理應收費用與收支總帳',         'action'),
  ('action:finance:confirm',   '確認球員回報的繳費紀錄',         'action'),
  ('action:players:manage',    '修改任一球員資訊（教練/管理）', 'action')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 預設系統角色
-- ---------------------------------------------------------------------------
insert into public.roles (id, name, description, is_system) values
  ('11111111-1111-1111-1111-111111111111', 'admin',   '系統管理員，擁有所有權限',     true),
  ('22222222-2222-2222-2222-222222222222', 'coach',   '教練，管理訓練、審核請假',     true),
  ('33333333-3333-3333-3333-333333333333', 'finance', '財務人員，管理費用與收支',     true),
  ('44444444-4444-4444-4444-444444444444', 'player',  '球員，預設只能看公開資訊',     true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- admin：全部權限
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_key)
select '11111111-1111-1111-1111-111111111111', key from public.permissions
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- coach：訓練、請假、球員管理；可看公告與財務（檢視）
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_key) values
  ('22222222-2222-2222-2222-222222222222', 'page:home:view'),
  ('22222222-2222-2222-2222-222222222222', 'page:players:view'),
  ('22222222-2222-2222-2222-222222222222', 'page:players:edit'),
  ('22222222-2222-2222-2222-222222222222', 'page:leaves:view'),
  ('22222222-2222-2222-2222-222222222222', 'page:training:view'),
  ('22222222-2222-2222-2222-222222222222', 'page:announcements:view'),
  ('22222222-2222-2222-2222-222222222222', 'action:training:manage'),
  ('22222222-2222-2222-2222-222222222222', 'action:training:attendance'),
  ('22222222-2222-2222-2222-222222222222', 'action:leaves:approve'),
  ('22222222-2222-2222-2222-222222222222', 'action:players:manage')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- finance：財務全包 + 看公告
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_key) values
  ('33333333-3333-3333-3333-333333333333', 'page:home:view'),
  ('33333333-3333-3333-3333-333333333333', 'page:finance:view'),
  ('33333333-3333-3333-3333-333333333333', 'page:payments:view'),
  ('33333333-3333-3333-3333-333333333333', 'page:announcements:view'),
  ('33333333-3333-3333-3333-333333333333', 'action:finance:manage'),
  ('33333333-3333-3333-3333-333333333333', 'action:finance:confirm')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- player：基本檢視 + 個人請假繳費
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_key) values
  ('44444444-4444-4444-4444-444444444444', 'page:home:view'),
  ('44444444-4444-4444-4444-444444444444', 'page:players:view'),
  ('44444444-4444-4444-4444-444444444444', 'page:leaves:view'),
  ('44444444-4444-4444-4444-444444444444', 'page:payments:view'),
  ('44444444-4444-4444-4444-444444444444', 'page:training:view')
on conflict do nothing;
