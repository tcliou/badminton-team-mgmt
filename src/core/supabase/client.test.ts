import { describe, it, expect } from 'vitest';
import { syntheticEmailFor } from './client';

describe('syntheticEmailFor', () => {
  it('小寫並加上預設網域', () => {
    expect(syntheticEmailFor('Alice')).toBe('alice@team.local');
  });

  it('保留 underscore / 數字', () => {
    expect(syntheticEmailFor('player_42')).toBe('player_42@team.local');
  });

  it('去除前後空白', () => {
    expect(syntheticEmailFor('  bob  ')).toBe('bob@team.local');
  });
});
