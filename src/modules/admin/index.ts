import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const adminModule: ModuleDescriptor = {
  id: 'admin',
  navLabelKey: 'common:nav.admin',
  navIcon: 'Shield',
  permissionKey: PERMISSIONS.PageAdmin,
  order: 90,
  showInNav: true,
  routes: [{ path: PATHS.Admin, element: lazy(() => import('./pages/AdminPage')) }],
};

export default adminModule;
