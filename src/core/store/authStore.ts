import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { ProfileRow } from '../supabase/types';

export type AuthProfile = ProfileRow & {
  role_names: string[];
  permission_keys: string[];
};

interface AuthState {
  /** Supabase session 物件；未登入為 null */
  session: Session | null;
  /** 對應 profiles + roles + permissions 的合併視圖 */
  profile: AuthProfile | null;
  /** 第一次載入會話狀態時為 true */
  loading: boolean;
  /** 設定整個會話 */
  setSession: (session: Session | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setLoading: (loading: boolean) => void;
  /** 完全清空 */
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ session: null, profile: null, loading: false }),
}));

/** 是否已登入 */
export const selectIsAuthenticated = (s: AuthState) => Boolean(s.session && s.profile);
