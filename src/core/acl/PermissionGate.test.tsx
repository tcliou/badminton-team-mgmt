import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from './PermissionGate';
import { PERMISSIONS } from './permissions';
import { useAuthStore } from '../store/authStore';
import type { AuthProfile } from '../store/authStore';

function loginWith(perms: string[]) {
  useAuthStore.setState({
    session: { user: { id: 'u' } } as never,
    loading: false,
    profile: {
      id: 'u',
      team_id: 't',
      username: 'test',
      display_name: 'Test',
      email: null,
      phone: null,
      avatar_url: null,
      birthday: null,
      dominant_hand: null,
      height_cm: null,
      weight_kg: null,
      favorite_racket: null,
      extra_info: {},
      must_change_password: false,
      status: 'active',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      created_by: null,
      role_names: ['admin'],
      permission_keys: perms,
    } satisfies AuthProfile,
  });
}

describe('<PermissionGate />', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, profile: null, loading: false });
  });

  it('有權限時顯示 children', () => {
    loginWith([PERMISSIONS.PageFinance]);
    render(
      <PermissionGate need={PERMISSIONS.PageFinance}>
        <span>finance</span>
      </PermissionGate>,
    );
    expect(screen.getByText('finance')).toBeInTheDocument();
  });

  it('無權限時隱藏 children', () => {
    loginWith([PERMISSIONS.PageHome]);
    render(
      <PermissionGate need={PERMISSIONS.PageFinance}>
        <span>finance</span>
      </PermissionGate>,
    );
    expect(screen.queryByText('finance')).not.toBeInTheDocument();
  });

  it('無權限時顯示 fallback', () => {
    loginWith([]);
    render(
      <PermissionGate need={PERMISSIONS.PageFinance} fallback={<span>nope</span>}>
        <span>finance</span>
      </PermissionGate>,
    );
    expect(screen.getByText('nope')).toBeInTheDocument();
  });
});
