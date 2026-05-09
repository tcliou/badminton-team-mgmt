import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { useCan } from '../acl/useCan';
import type { PermissionKey } from '../acl/permissions';
import { PATHS } from './paths';
import { Loading } from '@/shared/components/Loading';

interface ProtectedRouteProps {
  /** 需要的權限鍵；不填代表只要登入即可 */
  need?: PermissionKey | string;
  children: ReactNode;
}

/**
 * 路由守衛：
 *  1. 還在恢復 session 時顯示 Loading
 *  2. 未登入 → 導向 /login（並記錄 from）
 *  3. 已登入但 must_change_password → 導向 /change-password
 *  4. 已登入但無權限 → 導向 /403
 */
export function ProtectedRoute({ need, children }: ProtectedRouteProps) {
  const loading = useAuthStore((s) => s.loading);
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  const can = useCan(need ?? '__noop__');
  const noPermNeeded = !need;

  if (loading) return <Loading fullscreen />;

  if (!isAuthed) {
    return <Navigate to={PATHS.Login} replace state={{ from: location.pathname }} />;
  }

  if (profile?.must_change_password && location.pathname !== PATHS.ChangePassword) {
    return <Navigate to={PATHS.ChangePassword} replace />;
  }

  if (!noPermNeeded && !can) {
    return <Navigate to={PATHS.Forbidden} replace />;
  }

  return <>{children}</>;
}
