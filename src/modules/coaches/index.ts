import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PATHS } from '@/core/router/paths';

const coachesModule = {
  id: 'coaches',
  navLabelKey: 'common:nav.coaches',
  navIcon: 'UsersRound',
  order: 5,
  // No strict permission required to view coaches
  permissionKey: undefined,
  routes: [
    {
      path: PATHS.Coaches,
      element: lazy(() => import('./pages/CoachesPage').then((m) => ({ default: m.CoachesPage }))),
    },
  ],
} satisfies ModuleDescriptor;

export default coachesModule;
