import type { ReactNode } from 'react';
import { useCan } from './useCan';
import type { PermissionKey } from './permissions';

interface PermissionGateProps {
  /** 需要的權限鍵；陣列代表 anyOf */
  need: PermissionKey | string | (PermissionKey | string)[];
  children: ReactNode;
  /** 沒權限時顯示的內容（可選） */
  fallback?: ReactNode;
}

/**
 * 條件式渲染，沒權限就不出現。範例：
 *   <PermissionGate need={PERMISSIONS.PageFinance}><Link>財務</Link></PermissionGate>
 */
export function PermissionGate({ need, children, fallback = null }: PermissionGateProps) {
  const ok = useCan(need);
  return <>{ok ? children : fallback}</>;
}
