import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PATHS } from '@/core/router/paths';

const DocumentsPage = lazy(() =>
  import('./pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);

const documentsModule: ModuleDescriptor = {
  id: 'documents',
  navLabelKey: 'common:nav.documents',
  navIcon: 'FileText',
  order: 45,
  routes: [
    {
      path: PATHS.Documents,
      element: DocumentsPage,
    },
  ],
};

export default documentsModule;
