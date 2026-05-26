import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PATHS } from '@/core/router/paths';

const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);

const calendarModule: ModuleDescriptor = {
  id: 'calendar',
  navLabelKey: 'common:nav.calendar',
  navIcon: 'CalendarDays',
  order: 15, // Put it near Home/Announcements
  permissionKey: 'page:calendar:view',
  routes: [
    {
      path: PATHS.Calendar,
      element: CalendarPage,
    },
  ],
};

export default calendarModule;
