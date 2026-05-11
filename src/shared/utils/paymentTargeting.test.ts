import { describe, it, expect } from 'vitest';
import { isItemForPlayer } from './paymentTargeting';

const itemBase = { target_role_ids: [] as string[], target_user_ids: [] as string[] };

describe('isItemForPlayer', () => {
  it('兩個列表都空 → 全員都要繳', () => {
    expect(isItemForPlayer(itemBase, 'p1', [])).toBe(true);
    expect(isItemForPlayer(itemBase, 'p2', ['role-x'])).toBe(true);
  });

  it('target_user_ids 包含此球員 → true', () => {
    const item = { ...itemBase, target_user_ids: ['p1', 'p2'] };
    expect(isItemForPlayer(item, 'p1', [])).toBe(true);
    expect(isItemForPlayer(item, 'p3', ['anything'])).toBe(false);
  });

  it('target_role_ids 與球員的 roleIds 有交集 → true', () => {
    const item = { ...itemBase, target_role_ids: ['coach', 'finance'] };
    expect(isItemForPlayer(item, 'p1', ['coach'])).toBe(true);
    expect(isItemForPlayer(item, 'p1', ['player'])).toBe(false);
  });

  it('user 與 role 兩條件中只要符合一條就 true', () => {
    const item = {
      target_role_ids: ['admin'],
      target_user_ids: ['p1'],
    };
    expect(isItemForPlayer(item, 'p1', [])).toBe(true);  // 命中 user
    expect(isItemForPlayer(item, 'p2', ['admin'])).toBe(true); // 命中 role
    expect(isItemForPlayer(item, 'p3', ['coach'])).toBe(false); // 都沒中
  });

  it('roleIds 為空陣列也不會誤命中（some 對空 array 是 false）', () => {
    const item = { ...itemBase, target_role_ids: ['x'] };
    expect(isItemForPlayer(item, 'p1', [])).toBe(false);
  });
});
