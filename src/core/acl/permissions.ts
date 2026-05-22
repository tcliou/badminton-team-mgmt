/**
 * 集中管理所有權限鍵的字面常數，避免散落各處字串拼錯。
 * 與 supabase/migrations/0002_seed_permissions_roles.sql 一致。
 */
export const PERMISSIONS = {
  // 頁面
  PageHome:           'page:home:view',
  PagePlayers:        'page:players:view',
  PagePlayersEdit:    'page:players:edit',
  PageLeaves:         'page:leaves:view',
  PagePayments:       'page:payments:view',
  PageAnnouncements:  'page:announcements:view',
  PageFinance:        'page:finance:view',
  PageTraining:       'page:training:view',
  PageAdmin:          'page:admin:view',
  PageIssues:         'page:issues:view',
  PageEnrollments:    'page:enrollments:view',
  // 動作
  ActionUsersManage:        'action:users:manage',
  ActionRolesManage:        'action:roles:manage',
  ActionAnnouncementsManage:'action:announcements:manage',
  ActionTrainingManage:     'action:training:manage',
  ActionTrainingAttendance: 'action:training:attendance',
  ActionLeavesApprove:      'action:leaves:approve',
  ActionFinanceManage:      'action:finance:manage',
  ActionFinanceConfirm:     'action:finance:confirm',
  ActionPlayersManage:      'action:players:manage',
  ActionIssuesManage:       'action:issues:manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** 給定 user permission set 與所需 key，回傳是否擁有 */
export function hasPermission(userPerms: readonly string[], need: PermissionKey | string): boolean {
  return userPerms.includes(need);
}

/** 多個權限鍵：anyOf */
export function hasAnyPermission(
  userPerms: readonly string[],
  needs: readonly (PermissionKey | string)[],
): boolean {
  return needs.some((n) => userPerms.includes(n));
}
