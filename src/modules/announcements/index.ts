import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

const announcementsModule: ModuleDescriptor = {
  id: 'announcements',
  navLabelKey: 'common:nav.announcements',
  navIcon: 'Megaphone',
  permissionKey: PERMISSIONS.PageAnnouncements,
  order: 50,
  showInNav: true,
  routes: [
    { path: PATHS.Announcements, element: lazy(() => import('./pages/AnnouncementsPage')) },
  ],
};

export default announcementsModule;
