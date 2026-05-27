import { describe, it, expect } from 'vitest';
import { navModules, registeredModules } from './moduleRegistry';

describe('moduleRegistry', () => {
  it('should register modules from the file system', () => {
    expect(registeredModules.length).toBeGreaterThan(0);
    
    // Check if some known modules are registered
    const homeModule = registeredModules.find(m => m.id === 'home');
    expect(homeModule).toBeDefined();
    expect(homeModule?.order).toBeDefined();
  });

  it('navModules should return modules that are not hidden from nav', () => {
    const navItems = navModules();
    expect(navItems.length).toBeGreaterThan(0);
    
    // navModules should not include modules with showInNav === false
    const hasHiddenItems = navItems.some(m => m.showInNav === false);
    expect(hasHiddenItems).toBe(false);
  });
  
  it('navModules should be sorted by order', () => {
    const navItems = navModules();
    for (let i = 0; i < navItems.length - 1; i++) {
      const currentOrder = navItems[i]!.order ?? 100;
      const nextOrder = navItems[i + 1]!.order ?? 100;
      expect(currentOrder).toBeLessThanOrEqual(nextOrder);
    }
  });
});
