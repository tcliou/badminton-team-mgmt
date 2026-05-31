-- Fix Security Definer View alert
-- Change v_audit_logs to security_invoker = true so it respects RLS on audit_logs
create or replace view public.v_audit_logs with (security_invoker = true) as
select
  al.id,
  al.action,
  al.table_name,
  al.record_id,
  al.old_values,
  al.new_values,
  al.changed_keys,
  al.created_at,
  -- 操作者資訊
  p.username   as actor_username,
  p.display_name as actor_display_name,
  al.actor_ip
from public.audit_logs al
left join public.profiles p on p.id = al.actor_id;
