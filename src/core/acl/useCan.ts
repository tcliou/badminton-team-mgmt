import { useAuthStore } from '../store/authStore';
import { hasPermission, hasAnyPermission, type PermissionKey } from './permissions';

/**
 * 判斷登入者是否擁有某項權限。
 * 範例：const canApprove = useCan('action:leaves:approve');
 *
 * Selector 直接回傳 boolean，避免「每次都產生新陣列」造成多餘 re-render。
 */
export function useCan(need: PermissionKey | string | (PermissionKey | string)[]): boolean {
  return useAuthStore((s) => {
    const perms = s.profile?.permission_keys ?? [];
    return Array.isArray(need) ? hasAnyPermission(perms, need) : hasPermission(perms, need);
  });
}
