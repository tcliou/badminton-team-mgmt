import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const playersModule: ModuleDescriptor = {
  id: 'players',
  navLabelKey: 'common:nav.players',
  navIcon: 'Users',
  permissionKey: PERMISSIONS.PagePlayers,
  order: 20,
  showInNav: true,
  routes: [
    { path: PATHS.Players, element: lazy(() => import('./pages/PlayersPage')) },
    { path: `${PATHS.Players}/:id`, element: lazy(() => import('./pages/PlayerDetailPage')) },
  ],
};

export default playersModule;
