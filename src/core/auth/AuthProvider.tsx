import { useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { fetchMyProfile } from './authApi';

/**
 * AuthProvider：應用程式啟動時恢復 session、訂閱 auth 狀態變化、
 * 同步把 profile + roles + permissions 載入 Zustand store。
 *
 * 設計重點：**完全依賴 onAuthStateChange**，不另外呼叫 getSession()。
 * Supabase v2 在訂閱當下會立刻丟一個 INITIAL_SESSION 事件（含目前的 session
 * 或 null），所以單一入口就能涵蓋初次載入、登入、登出、token refresh。
 *
 * 之前同時用 getSession() + onAuthStateChange 的版本在 page refresh 時會
 * race：兩條 path 都跑 syncProfile，外層 finally 偶爾不 fire，loading 卡 true。
 *
 * 邊界情況：若 auth.users 有此 user 但 profiles 沒有對應列（例如管理員只在
 * Supabase Dashboard 建了 auth user 卻忘了跑 admin/profile migration），
 * 我們會視為「未完成設定的帳號」，自動 signOut 避免使用者卡在無權限的空殼裡。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);

      try {
        if (session) {
          const profile = await fetchMyProfile();
          if (!mounted) return;
          if (!profile) {
            // 有 session 但 profile 不存在 → 帳號未完成設定
            console.warn('[auth] session exists but no profile row; signing out');
            await supabase.auth.signOut();
            // signOut 會再觸發一次 onAuthStateChange(session=null)，
            // 那邊的 finally 會把 loading 設 false
            return;
          }
          setProfile(profile);
        } else {
          // 未登入或剛登出
          reset();
        }
      } catch (err) {
        console.error('[auth] auth state sync failed', err);
        // sync 失敗也視為不可用狀態，讓使用者回到登入頁
        await supabase.auth.signOut().catch(() => {});
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [reset, setLoading, setProfile, setSession]);

  return <>{children}</>;
}
