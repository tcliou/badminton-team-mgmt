import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const paymentsModule: ModuleDescriptor = {
  id: 'payments',
  navLabelKey: 'common:nav.payments',
  navIcon: 'CreditCard',
  permissionKey: PERMISSIONS.PagePayments,
  order: 35,
  showInNav: true,
  routes: [{ path: PATHS.Payments, element: lazy(() => import('./pages/PaymentsPage')) }],
};

export default paymentsModule;
