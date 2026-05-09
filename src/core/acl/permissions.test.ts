import { describe, it, expect } from 'vitest';
import { PERMISSIONS, hasPermission, hasAnyPermission } from './permissions';

describe('acl/permissions', () => {
  it('PERMISSIONS 包含所有頁面與動作鍵', () => {
    expect(PERMISSIONS.PageHome).toBe('page:home:view');
    expect(PERMISSIONS.ActionLeavesApprove).toBe('action:leaves:approve');
  });

  describe('hasPermission', () => {
    it('使用者擁有對應 key 時回傳 true', () => {
      expect(hasPermission(['page:home:view'], 'page:home:view')).toBe(true);
    });
    it('沒有對應 key 時回傳 false', () => {
      expect(hasPermission(['page:home:view'], 'page:finance:view')).toBe(false);
    });
    it('空陣列一律 false', () => {
      expect(hasPermission([], PERMISSIONS.PageHome)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('擁有其中一個就 true', () => {
      const perms = ['page:home:view', 'page:players:view'];
      expect(hasAnyPermission(perms, ['page:finance:view', 'page:players:view'])).toBe(true);
    });
    it('全部都沒有則 false', () => {
      expect(hasAnyPermission(['page:home:view'], ['action:roles:manage'])).toBe(false);
    });
    it('需求列表為空時 false（不放行）', () => {
      expect(hasAnyPermission(['page:home:view'], [])).toBe(false);
    });
  });
});
