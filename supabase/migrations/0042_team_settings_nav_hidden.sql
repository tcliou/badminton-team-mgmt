-- =============================================================================
-- 0042_team_settings_nav_hidden.sql
-- =============================================================================

alter table public.team_settings 
add column if not exists nav_hidden text[] not null default '{}'::text[];
