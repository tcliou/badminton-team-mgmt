import { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { registeredModules } from './moduleRegistry';
import { ProtectedRoute } from './ProtectedRoute';
import { PATHS } from './paths';
import { Loading } from '@/shared/components/Loading';
import { AppLayout } from '@/shared/components/AppLayout';

const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const ChangePasswordPage = lazy(() => import('@/modules/auth/pages/ChangePasswordPage'));
const ForbiddenPage = lazy(() => import('@/shared/components/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/shared/components/NotFoundPage'));

export function AppRouter() {
  return (
    <Suspense fallback={<Loading fullscreen />}>
      <Routes>
        {/* 公開路由 */}
        <Route path={PATHS.Login} element={<LoginPage />} />
        <Route path={PATHS.Forbidden} element={<ForbiddenPage />} />

        {/* 改密頁：要求已登入，但不檢查權限 */}
        <Route
          path={PATHS.ChangePassword}
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* 主應用：套用 AppLayout，自動依模組註冊掛上路由 */}
        <Route element={<AppLayout />}>
          {registeredModules.flatMap((mod) =>
            mod.routes.map((r) => {
              const Element = r.element;
              return (
                <Route
                  key={`${mod.id}-${r.path}`}
                  path={r.path}
                  element={
                    <ProtectedRoute need={mod.permissionKey}>
                      <Element />
                    </ProtectedRoute>
                  }
                />
              );
            }),
          )}
        </Route>

        {/* 404 */}
        <Route path={PATHS.NotFound} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={PATHS.NotFound} replace />} />
      </Routes>
    </Suspense>
  );
}
