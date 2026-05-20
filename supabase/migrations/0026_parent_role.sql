-- 0026_parent_role.sql

-- 1. Insert parent role
INSERT INTO public.roles (id, name, description, is_system)
VALUES ('55555555-5555-5555-5555-555555555555', 'parent', '家長，可以幫小孩請假、繳費與查看訓練', true)
ON CONFLICT (id) DO NOTHING;

-- Give parent basic permissions
-- 正確的 key 參照 0002_seed_permissions_roles.sql：
--   page:home:view, page:leaves:view, page:payments:view,
--   page:finance:view, page:announcements:view, page:training:view
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT '55555555-5555-5555-5555-555555555555', key
FROM public.permissions
WHERE key IN (
  'page:home:view',
  'page:leaves:view',
  'page:payments:view',
  'page:finance:view',
  'page:announcements:view',
  'page:training:view'
)
ON CONFLICT DO NOTHING;

-- 2. Create player_parents table
CREATE TABLE IF NOT EXISTS public.player_parents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(parent_id, player_id)
);

ALTER TABLE public.player_parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player_parents" ON public.player_parents FOR SELECT USING (true);
CREATE POLICY "Admins can manage player_parents" ON public.player_parents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
