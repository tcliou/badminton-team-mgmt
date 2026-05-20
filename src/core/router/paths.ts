/** 集中管理所有路由路徑常數 */
export const PATHS = {
  Login: '/login',
  ChangePassword: '/change-password',
  Home: '/',
  Players: '/players',
  Parents: '/parents',
  Leaves: '/leaves',
  Payments: '/payments',
  Training: '/training',
  Announcements: '/announcements',
  Finance: '/finance',
  Admin: '/admin',
  Issues: '/issues',
  Forbidden: '/403',
  NotFound: '/404',
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
