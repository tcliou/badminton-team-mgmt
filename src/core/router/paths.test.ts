import { describe, it, expect } from 'vitest';
import { PATHS } from './paths';

describe('PATHS', () => {
  it('should define known paths correctly', () => {
    expect(PATHS.Home).toBe('/');
    expect(PATHS.Login).toBe('/login');
    expect(PATHS.Admin).toBe('/admin');
    expect(PATHS.Calendar).toBe('/calendar');
    expect(PATHS.Documents).toBe('/documents');
  });

  it('should not contain any empty strings', () => {
    Object.values(PATHS).forEach((path) => {
      expect(path.length).toBeGreaterThan(0);
      expect(path.startsWith('/') || path.startsWith('http')).toBe(true);
    });
  });
});
