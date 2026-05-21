import { useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/authStore';
import { fetchMyProfile } from './authApi';

/**
 * AuthProvider：應用程式啟動時恢復 session、訂閱後續變化、
 * 同步把 profile + roles + permissions 載入 Zustand store。
 *
 * **關鍵設計：onAuthStateChange callback 本身必須是同步的**
 * Supabase JS v2 在 callback 執行期間持有內部 auth lock，如果 callback 是 async
 * 並在裡面呼叫 supabase.from()，那個 query 需要 auth token、token 取用又需要
 * 同一把 lock，會永久死結（症狀：fetchMyProfile 永遠 await 不會回來）。
 *
 * 解法：把所有 async 工作用 setTimeout(0) 推到下一個 tick，讓 callback 直接
 * return、lock 立即釋放，然後 deferred 那段在乾淨的 stack 上跑。
 *
 * 這是 Supabase 官方文件特別記載的注意事項：
 *   https://supabase.com/docs/reference/javascript/auth-onauthstatechange
 */
const WATCHDOG_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { setSession, setProfile, setLoading, reset } = useAuthStore.getState();
    let mounted = true;
    // 診斷 log 限制在 dev 環境；production 永遠關閉，避免 session 資訊洩露
    // 注意：我們有意移除此前的 localStorage debug flag，
    //   因為在 production 開放 localStorage override 会成為資訊洩露向量。
    const isDebug = import.meta.env.DEV;
    const t0 = performance.now();
    const log = (...args: unknown[]) => {
      if (!isDebug) return;
      console.log(`[auth +${Math.round(performance.now() - t0)}ms]`, ...args);
    };
    log('AuthProvider mounted');

    /** 把 session 套到 store 並（必要時）拉 profile。一律在自己的 tick 跑。 */
    const handleSession = async (session: Session | null, source: string): Promise<void> => {
      if (!mounted) {
        log(`handleSession[${source}]: skipped (unmounted)`);
        return;
      }
      log(`handleSession[${source}]: session=`, session ? `user=${session.user.id}` : 'null');
      setSession(session);

      if (!session) {
        reset();
        return;
      }

      try {
        log(`handleSession[${source}]: fetchMyProfile start`);
        const profile = await fetchMyProfile();
        log(`handleSession[${source}]: fetchMyProfile resolved, profile=`, profile ? 'ok' : 'null');
        if (!mounted) return;
        if (!profile) {
          console.warn('[auth] session exists but no profile row; signing out');
          await supabase.auth.signOut();
          return;
        }
        setProfile(profile);
      } catch (err) {
        console.error('[auth] fetchMyProfile failed', err);
        await supabase.auth.signOut().catch(() => {});
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Watchdog：5 秒還沒結束就強制解 loading，避免畫面永遠卡 spinner
    const watchdog = window.setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.error('[auth] watchdog fired after', WATCHDOG_MS, 'ms — forcing loading=false');
        setLoading(false);
      }
    }, WATCHDOG_MS);

    // ── onAuthStateChange：callback 必須同步，async 工作 setTimeout 推 deferred ──
    // 注意：Supabase 在訂閱當下會 fire 一個事件（INITIAL_SESSION 或 SIGNED_IN，
    // 視 client 內部狀態而定），所以光靠這個 listener 就足以處理初始狀態，
    // 不需要另外呼叫 getSession()——那會跟 lock 搶資源、容易死結。
    //
    // 去重：v2 對「已登入使用者重整頁面」會連續 fire SIGNED_IN + INITIAL_SESSION
    // 兩個帶相同 session 的事件。用 access_token 比對，相同 token 視為同一邏輯
    // 事件、跳過，避免每次 reload 多打一次 v_my_profile 查詢。
    let lastAccessToken: string | undefined;
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      log('onAuthStateChange event=', event);
      const token = session?.access_token;
      if (event !== 'SIGNED_OUT' && token === lastAccessToken && token !== undefined) {
        log(`onAuthStateChange skipped (duplicate token for ${event})`);
        return;
      }
      lastAccessToken = token;
      // 全部用 setTimeout 推到下一個 tick，讓 Supabase 釋放 auth lock
      window.setTimeout(() => {
        void handleSession(session, event);
      }, 0);
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
