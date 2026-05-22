import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';

export default {
  id: 'enrollments',
  order: 5,
  navLabelKey: 'enrollments:title',
  navIcon: 'CalendarDays',
  permissionKey: 'page:enrollments:view',
  routes: [
    {
      path: '/enrollments',
      element: lazy(() => import('./pages/EnrollmentsPage').then((m) => ({ default: m.EnrollmentsPage }))),
    },
    {
      path: '/enrollments/:id',
      element: lazy(() => import('./pages/EnrollmentDetailPage').then((m) => ({ default: m.EnrollmentDetailPage }))),
    },
  ],
} satisfies ModuleDescriptor;
