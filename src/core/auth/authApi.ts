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

/**
 * 改密碼（以及把 must_change_password 設為 false）。
 *
 * 順序很關鍵：必須**先**更新 profile，**後**更新 password。
 * 因為 supabase.auth.updateUser 會觸發 USER_UPDATED 事件，AuthProvider 監聽到
 * 之後會非同步重新 fetch profile。如果先更新密碼再更新 profile，那次 fetch
 * 可能會在 profile update 之前完成，撈到 must_change_password=true 的舊狀態，
 * 把 Zustand store 蓋成舊值，使用者就會被 ProtectedRoute 永遠 bounce 回改密頁。
 */
export async function changePassword(newPassword: string) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData.user?.id;
  if (!userId) throw new Error('not authenticated');

  // 先更新 profile
  const { error: profErr } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userId);
  if (profErr) throw profErr;

  // 再更新密碼（觸發的 USER_UPDATED 事件去 refetch 時 profile 已是新狀態）
  const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
  if (pwErr) throw pwErr;
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
