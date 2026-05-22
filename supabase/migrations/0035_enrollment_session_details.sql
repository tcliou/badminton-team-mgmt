-- 0035_enrollment_session_details.sql

ALTER TABLE public.training_enrollment_forms
ADD COLUMN IF NOT EXISTS session_details jsonb NOT NULL DEFAULT '{}'::jsonb;
