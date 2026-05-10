import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const leavesModule: ModuleDescriptor = {
  id: 'leaves',
  navLabelKey: 'common:nav.leaves',
  navIcon: 'CalendarOff',
  permissionKey: PERMISSIONS.PageLeaves,
  order: 30,
  showInNav: true,
  routes: [{ path: PATHS.Leaves, element: lazy(() => import('./pages/LeavesPage')) }],
};

export default leavesModule;
