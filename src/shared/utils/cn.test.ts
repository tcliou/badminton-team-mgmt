import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('合併多個 class 字串', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('忽略 falsy 值', () => {
    expect(cn('foo', false && 'bar', null, undefined, '')).toBe('foo');
  });

  it('條件式 class 物件', () => {
    expect(cn({ active: true, hidden: false })).toBe('active');
  });

  it('Tailwind 衝突解析：後者優先', () => {
    // twMerge 應以 p-4 覆蓋 p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('無參數回傳空字串', () => {
    expect(cn()).toBe('');
  });
});
