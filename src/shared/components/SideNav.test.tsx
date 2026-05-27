import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useAuthStore } from '@/core/store/authStore';
import { useTeamSettings } from '@/core/api/settingsApi';
import { navModules } from '@/core/router/moduleRegistry';

// Mock dependencies
vi.mock('@/core/store/authStore');
vi.mock('@/core/api/settingsApi');
vi.mock('@/core/router/moduleRegistry', () => ({
  navModules: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Icons
vi.mock('./navIcons', () => ({
  resolveNavIcon: () => () => <div data-testid="mock-icon" />,
}));

describe('SideNav', () => {
  const mockModules = [
    { id: 'home', navLabelKey: 'nav.home', routes: [{ path: '/' }], order: 1 },
    { id: 'settings', navLabelKey: 'nav.settings', routes: [{ path: '/settings' }], permissionKey: 'page:settings', order: 2 },
    { id: 'calendar', navLabelKey: 'nav.calendar', routes: [{ path: '/calendar' }], order: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (navModules as any).mockReturnValue(mockModules);
    
    // Default auth store mock
    (useAuthStore as any).mockReturnValue({
      permission_keys: ['page:settings']
    });

    // Default settings mock
    (useTeamSettings as any).mockReturnValue({
      data: null
    });
  });

  it('renders correctly with base modules', () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );

    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
    expect(screen.getByText('nav.calendar')).toBeInTheDocument();
  });

  it('filters out modules if user lacks permission', () => {
    (useAuthStore as any).mockReturnValue({
      permission_keys: [] // No permissions
    });

    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );

    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
  });

  it('filters out modules if they are in nav_hidden', () => {
    (useTeamSettings as any).mockReturnValue({
      data: {
        nav_hidden: ['calendar']
      }
    });

    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );

    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
    expect(screen.queryByText('nav.calendar')).not.toBeInTheDocument();
  });

  it('sorts modules based on nav_order', () => {
    (useTeamSettings as any).mockReturnValue({
      data: {
        nav_order: ['calendar', 'home', 'settings'],
        nav_hidden: []
      }
    });

    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );

    const items = screen.getAllByRole('link');
    // Expect order: calendar (0), home (1), settings (2)
    expect(items[0]!.getAttribute('href')).toBe('/calendar');
    expect(items[1]!.getAttribute('href')).toBe('/');
    expect(items[2]!.getAttribute('href')).toBe('/settings');
  });
});
