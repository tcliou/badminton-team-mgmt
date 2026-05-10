import { useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { fetchMyProfile } from './authApi';

/**
 * AuthProvider：應用程式啟動時恢復 session、訂閱後續變化、
 * 同步把 profile + roles + permissions 載入 Zustand store。
 *
 * 採 Supabase 官方建議的雙 path 模式：
 *   1. **啟動一次性**用 `getSession()` 取得目前狀態並結束 loading
 *   2. **後續事件**用 `onAuthStateChange`，跳過 INITIAL_SESSION 避免 race
 *
 * 防呆：
 *   - 任何路徑都會結束 loading（finally 區塊不再用 mounted guard 擋）
 *   - 5 秒 watchdog：getSession 真的 hang 時也會強制解除 loading
 *   - `[auth]` 前綴的 log 方便你在 console 追執行流程
 */
const WATCHDOG_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 直接從 store 取 setter（穩定 reference），不要 destructure useAuthStore()
    // 否則 AuthProvider 會訂閱整個 store，任何狀態變動都會 re-render
    const { setSession, setProfile, setLoading, reset } = useAuthStore.getState();
    let mounted = true;
    const t0 = performance.now();
    const log = (...args: unknown[]) =>
      console.log(`[auth +${Math.round(performance.now() - t0)}ms]`, ...args);
    log('AuthProvider mounted');

    /** 共用：把 session 同步到 store，並依 session 狀態決定要不要拉 profile */
    const applySession = async (session: Session | null): Promise<void> => {
      if (!mounted) {
        log('applySession: skipped (unmounted)');
        return;
      }
      log('applySession: session=', session ? `user=${session.user.id}` : 'null');
      setSession(session);

      if (!session) {
        reset();
        return;
      }

      try {
        log('applySession: fetchMyProfile start');
        const profile = await fetchMyProfile();
        log('applySession: fetchMyProfile resolved, profile=', profile ? 'ok' : 'null');
        if (!profile) {
          console.warn('[auth] session exists but no profile row; signing out');
          await supabase.auth.signOut();
          return;
        }
        setProfile(profile);
      } catch (err) {
        console.error('[auth] fetchMyProfile failed', err);
        await supabase.auth.signOut().catch(() => {});
      }
    };

    // 5 秒 watchdog：若初始化還沒結束就強制解除 loading，避免畫面永遠卡 spinner
    const watchdog = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.error('[auth] watchdog fired after', WATCHDOG_MS, 'ms — forcing loading=false');
        setLoading(false);
      }
    }, WATCHDOG_MS);

    // ── 1. 啟動時抓一次 session ──
    void (async () => {
      try {
        log('getSession start');
        const {
          data: { session },
        } = await supabase.auth.getSession();
        log('getSession resolved');
        await applySession(session);
      } catch (err) {
        console.error('[auth] getSession failed', err);
      } finally {
        // 故意不擋 mounted：即使元件卸載也要把 loading 設 false
        // 才能讓下一次掛載拿到正確初始狀態。Zustand 的 set 對未掛載元件無害。
        clearTimeout(watchdog);
        log('init finished, setLoading(false)');
        setLoading(false);
      }
    })();

    // ── 2. 訂閱後續變化（INITIAL_SESSION 由 step 1 處理，這邊跳過避免 race）──
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('onAuthStateChange event=', event);
      if (event === 'INITIAL_SESSION') return;
      await applySession(session);
    });

    return () => {
      log('AuthProvider unmount');
      mounted = false;
      clearTimeout(watchdog);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
