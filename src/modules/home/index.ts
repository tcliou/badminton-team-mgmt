import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const homeModule: ModuleDescriptor = {
  id: 'home',
  navLabelKey: 'common:nav.home',
  navIcon: 'Home',
  permissionKey: PERMISSIONS.PageHome,
  order: 10,
  showInNav: true,
  routes: [{ path: PATHS.Home, element: lazy(() => import('./pages/HomePage')) }],
};

export default homeModule;
