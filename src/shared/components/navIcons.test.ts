import { describe, it, expect } from 'vitest';
import { FALLBACK_NAV_ICON, NAV_ICONS, resolveNavIcon } from './navIcons';

describe('navIcons', () => {
  it('NAV_ICONS 包含 Phase 2 所有用到的 key', () => {
    const required = [
      'Home',
      'Users',
      'CalendarOff',
      'Dumbbell',
      'CreditCard',
      'Megaphone',
      'Wallet',
      'Shield',
    ];
    for (const k of required) {
      expect(NAV_ICONS).toHaveProperty(k);
    }
  });

  it('已知 key → 對應 lucide icon', () => {
    expect(resolveNavIcon('Home')).toBe(NAV_ICONS.Home);
  });

  it('未知 key → fallback', () => {
    expect(resolveNavIcon('NoSuchIcon')).toBe(FALLBACK_NAV_ICON);
  });

  it('undefined → fallback', () => {
    expect(resolveNavIcon(undefined)).toBe(FALLBACK_NAV_ICON);
  });
});
