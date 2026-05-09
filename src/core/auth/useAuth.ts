import { useCallback } from 'react';
import { useAuthStore, selectIsAuthenticated, type AuthProfile } from '../store/authStore';
import * as authApi from './authApi';

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const signIn = useCallback(
    async (username: string, password: string) => authApi.signInWithUsername(username, password),
    [],
  );
  const signOut = useCallback(async () => authApi.signOut(), []);
  const changePassword = useCallback(async (pw: string) => authApi.changePassword(pw), []);

  return {
    session,
    profile: profile as AuthProfile | null,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    changePassword,
  };
}
