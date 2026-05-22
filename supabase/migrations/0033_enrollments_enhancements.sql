-- 0033_enrollments_enhancements.sql

-- 1. Add description to forms
ALTER TABLE public.training_enrollment_forms
ADD COLUMN IF NOT EXISTS description text DEFAULT '1 為已報名
0 為報名整季，但當天請假

📌 報名規則
1. 整季報名：基礎訓練費計算，可請假一次並辦理退費。
2. 預先單堂報名：基礎訓練費 + 60 元，請假不退費。
3. 當週單堂報名：基礎訓練費 + 100 元。

※ 每週球員訓練總人數上限為 24 位。';

-- 2. Add permission for viewing enrollments
INSERT INTO public.permissions (key, description, category) 
VALUES ('page:enrollments:view', '檢視團練報名頁', 'page')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- 3. Assign the permission to all default roles so everyone can view and enroll
INSERT INTO public.role_permissions (role_id, permission_key) VALUES
  ('11111111-1111-1111-1111-111111111111', 'page:enrollments:view'), -- admin
  ('22222222-2222-2222-2222-222222222222', 'page:enrollments:view'), -- coach
  ('33333333-3333-3333-3333-333333333333', 'page:enrollments:view'), -- finance
  ('44444444-4444-4444-4444-444444444444', 'page:enrollments:view'), -- player
  ('55555555-5555-5555-5555-555555555555', 'page:enrollments:view')  -- parent
ON CONFLICT (role_id, permission_key) DO NOTHING;
