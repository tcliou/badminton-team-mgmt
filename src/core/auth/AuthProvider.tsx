import { useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { fetchMyProfile } from './authApi';

/**
 * AuthProvider：應用程式啟動時恢復 session、訂閱 auth 狀態變化、
 * 同步把 profile + roles + permissions 載入 Zustand store。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // 1. 啟動時取得目前 session
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);

      if (session) {
        try {
          const profile = await fetchMyProfile();
          if (!mounted) return;
          setProfile(profile);
        } catch (err) {
          console.error('[auth] fetchMyProfile failed', err);
        }
      }
      setLoading(false);
    })();

    // 2. 訂閱後續 sign in / sign out / token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        try {
          const profile = await fetchMyProfile();
          setProfile(profile);
        } catch (err) {
          console.error('[auth] fetchMyProfile failed', err);
        }
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
