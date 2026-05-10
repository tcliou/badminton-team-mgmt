import { describe, it, expect } from 'vitest';
import { QK } from './queryKeys';

describe('QK', () => {
  it('靜態 key 是 readonly tuple', () => {
    expect(QK.profile.me).toEqual(['profile', 'me']);
    expect(QK.leaves.mine).toEqual(['leaves', 'mine']);
    expect(QK.leaves.pending).toEqual(['leaves', 'pending']);
  });

  it('動態 key 帶入參數產生穩定路徑', () => {
    expect(QK.profile.detail('abc')).toEqual(['profiles', 'detail', 'abc']);
    expect(QK.player.matches('p1')).toEqual(['player', 'matches', 'p1']);
    expect(QK.training.attendance('t1')).toEqual(['training', 'attendance', 't1']);
  });

  it('行事曆範圍 key 由前綴 + 範圍組成（前綴可作 partial invalidate）', () => {
    const k = QK.calendar.teamRange('2026-05-01', '2026-05-31');
    expect(k[0]).toBe('calendar');
    expect(k[1]).toBe('team');
    expect(k).toHaveLength(4);
  });
});
