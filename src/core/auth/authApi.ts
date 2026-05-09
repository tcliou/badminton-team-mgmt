import { supabase, syntheticEmailFor } from '../supabase/client';
import type { AuthProfile } from '../store/authStore';

/** 以 username + password 登入 */
export async function signInWithUsername(username: string, password: string) {
  const email = syntheticEmailFor(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** 登出 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** 改密碼（以及把 must_change_password 設為 false） */
export async function changePassword(newPassword: string) {
  const { data: pwData, error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
  if (pwErr) throw pwErr;
  const userId = pwData.user?.id;
  if (userId) {
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId);
    if (profErr) throw profErr;
  }
}

/** 載入當前登入者的完整 profile + roles + permissions */
export async function fetchMyProfile(): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('v_my_profile')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as AuthProfile | null) ?? null;
}
