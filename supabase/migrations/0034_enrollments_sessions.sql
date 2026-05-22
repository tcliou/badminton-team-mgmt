-- 0034_enrollments_sessions.sql

-- 1. Add generate_sessions to forms
ALTER TABLE public.training_enrollment_forms
ADD COLUMN IF NOT EXISTS generate_sessions boolean NOT NULL DEFAULT true;

-- 2. Add JSONB columns to rows for per-session data
ALTER TABLE public.training_enrollment_rows
ADD COLUMN IF NOT EXISTS daily_status jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS daily_info jsonb NOT NULL DEFAULT '{}'::jsonb;
