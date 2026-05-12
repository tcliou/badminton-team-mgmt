-- 0025_issues_enhancements.sql

-- Add new columns to issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT 'task', -- 'epic', 'task', 'bug'
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.issues(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Create issue_links table for dependencies
CREATE TABLE IF NOT EXISTS public.issue_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'blocks', -- 'blocks' means source_id blocks target_id
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(source_id, target_id, link_type)
);

-- RLS for issue_links
ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue_links" ON public.issue_links FOR SELECT USING (true);
CREATE POLICY "Anyone can insert issue_links" ON public.issue_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete issue_links" ON public.issue_links FOR DELETE USING (true);
