import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const issuesModule: ModuleDescriptor = {
  id: 'issues',
  navLabelKey: 'common:nav.issues',
  navIcon: 'CheckSquare',
  permissionKey: PERMISSIONS.PageIssues,
  order: 90,
  showInNav: true,
  routes: [{ path: PATHS.Issues, element: lazy(() => import('./pages/IssuesPage')) }],
};

export default issuesModule;
