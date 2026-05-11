import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const financeModule: ModuleDescriptor = {
  id: 'finance',
  navLabelKey: 'common:nav.finance',
  navIcon: 'Wallet',
  permissionKey: PERMISSIONS.PageFinance,
  order: 70,
  showInNav: true,
  routes: [{ path: PATHS.Finance, element: lazy(() => import('./pages/FinancePage')) }],
};

export default financeModule;
