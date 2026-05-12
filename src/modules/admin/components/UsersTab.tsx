import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Pencil, UserPlus } from 'lucide-react';
import { useUsersWithRoles, type UserWithRoles } from '../api/adminApi';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { UserRolesEditor } from './UserRolesEditor';
import { CreateUserDialog } from './CreateUserDialog';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

export function UsersTab() {
  const { t } = useTranslation();
  const users = useUsersWithRoles();
  const roles = useAllRoles();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<UserWithRoles | null>(null);
  const [creating, setCreating] = useState(false);

  const roleNameById = useMemo(() => {
    const m = new Map<string, string>();
    (roles.data ?? []).forEach((r) => m.set(r.id, r.name));
    return m;
  }, [roles.data]);

  const filtered = useMemo(() => {
    if (!users.data) return [];
    if (!q.trim()) return users.data;
    const needle = q.trim().toLowerCase();
    return users.data.filter(
      (u) =>
        u.display_name.toLowerCase().includes(needle) ||
        u.username.toLowerCase().includes(needle),
    );
  }, [users.data, q]);

  return (
    <div className="space-y-3">
      {/* 標題列 + 新增按鈕 */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin:users.search')}
            className="pl-8"
          />
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setCreating(true)}
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {t('admin:createUser.newUser')}
        </Button>
      </div>

      {users.isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('admin:users.noUsers')} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-card p-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{u.display_name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">@{u.username}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('admin:users.currentRoles')}
                  {u.role_ids.length === 0
                    ? t('admin:users.noRoles')
                    : u.role_ids
                        .map((id) => roleNameById.get(id) ?? '?')
                        .join('、')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(u)}
                className="gap-1"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {t('admin:users.edit')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <UserRolesEditor
        open={Boolean(editing)}
        user={editing}
        onClose={() => setEditing(null)}
      />

      <CreateUserDialog
        open={creating}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
