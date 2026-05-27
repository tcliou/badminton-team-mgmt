-- 修正外鍵，從 auth.users 轉向 public.profiles
ALTER TABLE public.announcement_reads
  DROP CONSTRAINT IF EXISTS announcement_reads_user_id_fkey;

ALTER TABLE public.announcement_reads
  ADD CONSTRAINT announcement_reads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
