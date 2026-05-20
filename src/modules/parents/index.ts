import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const parentsModule: ModuleDescriptor = {
  id: 'parents',
  navLabelKey: 'common:nav.parents',
  navIcon: 'Users',
  permissionKey: PERMISSIONS.PagePlayers,
  order: 25,
  showInNav: true,
  routes: [
    { path: PATHS.Parents, element: lazy(() => import('./pages/ParentsPage')) },
    { path: `${PATHS.Parents}/:id`, element: lazy(() => import('./pages/ParentDetailPage')) },
  ],
};

export default parentsModule;
