-- 0024_issues_tracker.sql
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Anyone can create issues" ON public.issues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Anyone can update issues" ON public.issues FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete issues" ON public.issues FOR DELETE USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS issues_set_updated_at ON public.issues;
CREATE TRIGGER issues_set_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

-- Add permissions
INSERT INTO public.permissions (key, description, category) VALUES
  ('page:issues:view', '檢視待辦事項', 'page'),
  ('action:issues:manage', '管理待辦事項（建立、修改、刪除）', 'action')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT '11111111-1111-1111-1111-111111111111', 'page:issues:view' ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT '11111111-1111-1111-1111-111111111111', 'action:issues:manage' ON CONFLICT DO NOTHING;

-- Grant permissions to coach role
INSERT INTO public.role_permissions (role_id, permission_key) VALUES
('22222222-2222-2222-2222-222222222222', 'page:issues:view'),
('22222222-2222-2222-2222-222222222222', 'action:issues:manage')
ON CONFLICT DO NOTHING;

-- Grant permissions to player role
INSERT INTO public.role_permissions (role_id, permission_key) VALUES
('44444444-4444-4444-4444-444444444444', 'page:issues:view'),
('44444444-4444-4444-4444-444444444444', 'action:issues:manage')
ON CONFLICT DO NOTHING;
