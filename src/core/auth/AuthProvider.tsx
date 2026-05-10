import { useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { fetchMyProfile } from './authApi';

/**
 * AuthProvider：應用程式啟動時恢復 session、訂閱 auth 狀態變化、
 * 同步把 profile + roles + permissions 載入 Zustand store。
 *
 * 邊界情況：若 auth.users 有此 user 但 profiles 沒有對應列（例如管理員只在
 * Supabase Dashboard 建了 auth user 卻忘了跑 admin/profile migration），
 * 我們會視為「未完成設定的帳號」，自動 signOut 避免使用者卡在無權限的空殼裡。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    /** 共用的 profile 載入邏輯，含 orphan auth user 自動登出 */
    const syncProfile = async () => {
      try {
        const profile = await fetchMyProfile();
        if (!mounted) return;
        if (!profile) {
          // 有 session 但 profile 不存在 → 帳號未完成設定，登出避免卡住 UI
          console.warn('[auth] session exists but no profile row; signing out');
          await supabase.auth.signOut();
          return;
        }
        setProfile(profile);
      } catch (err) {
        console.error('[auth] fetchMyProfile failed', err);
        // 查 profile 失敗也視為不可用狀態，登出避免持續卡載入
        await supabase.auth.signOut();
      }
    };

    // 1. 啟動時取得目前 session
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        if (session) {
          await syncProfile();
        }
      } catch (err) {
        console.error('[auth] getSession failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // 2. 訂閱後續 sign in / sign out / token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await syncProfile();
      } else {
        reset();
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [reset, setLoading, setProfile, setSession]);

  return <>{children}</>;
}
