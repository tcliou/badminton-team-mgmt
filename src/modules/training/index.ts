import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const trainingModule: ModuleDescriptor = {
  id: 'training',
  navLabelKey: 'common:nav.training',
  navIcon: 'Dumbbell',
  permissionKey: PERMISSIONS.PageTraining,
  order: 40,
  showInNav: true,
  routes: [{ path: PATHS.Training, element: lazy(() => import('./pages/TrainingPage')) }],
};

export default trainingModule;
