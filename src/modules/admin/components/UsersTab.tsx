import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Pencil, UserPlus, Trash2, KeyRound } from 'lucide-react';
import { useUsersWithRoles, useUpdateUserStatus, useDeleteUser, type UserWithRoles } from '../api/adminApi';
import { useAuthStore } from '@/core/store/authStore';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { UserRolesEditor } from './UserRolesEditor';
import { CreateUserDialog } from './CreateUserDialog';
import { ResetPasswordResultDialog } from './ResetPasswordResultDialog';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useResetUserPassword } from '../api/createUserApi';

export function UsersTab() {
  const { t } = useTranslation();
  const users = useUsersWithRoles();
  const roles = useAllRoles();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  const currentUserId = useAuthStore((s) => s.profile?.id);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<UserWithRoles | null>(null);
  const [creating, setCreating] = useState(false);
  // 重設密碼結果 dialog state
  const [resetResult, setResetResult] = useState<{ displayName: string; tempPassword: string } | null>(null);

  const handleToggleStatus = async (u: UserWithRoles) => {
    const next = u.status === 'active' ? 'suspended' : 'active';
    const msg =
      next === 'suspended'
        ? t('admin:users.suspendConfirm', { name: u.display_name })
        : t('admin:users.activateConfirm', { name: u.display_name });
    if (!window.confirm(msg)) return;
    await updateStatus.mutateAsync({ userId: u.id, status: next });
  };

  const handleResetPassword = async (u: UserWithRoles) => {
    if (!window.confirm(t('admin:users.resetPasswordConfirm', { name: u.display_name }))) return;
    const result = await resetPassword.mutateAsync(u.id);
    // 用安全 modal 顯示，取代 window.alert()（alert 可被瀏覽器 extension 攔截）
    setResetResult({ displayName: u.display_name, tempPassword: result.tempPassword });
  };

  const handleDelete = async (u: UserWithRoles) => {
    // 兩步驟確認：先一般 confirm，再輸入帳號確認
    if (!window.confirm(t('admin:users.deleteConfirm', { name: u.display_name }))) return;
    const input = window.prompt(t('admin:users.deleteConfirmUsername', { username: u.username }));
    if (input?.trim() !== u.username) {
      if (input !== null) window.alert(t('admin:users.deleteAborted'));
      return;
    }
    await deleteUser.mutateAsync(u.id);
  };

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
              className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-card p-3 transition-opacity ${
                u.status === 'suspended' ? 'opacity-60' : ''
              }`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{u.display_name}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  {u.status === 'suspended' && (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                      {t('admin:users.suspended')}
                    </span>
                  )}
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
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={u.status === 'suspended' ? 'outline' : 'ghost'}
                  onClick={() => void handleToggleStatus(u)}
                  disabled={updateStatus.isPending || deleteUser.isPending}
                  className={u.status === 'active' ? 'gap-1 text-destructive hover:text-destructive' : 'gap-1 text-green-600 hover:text-green-600'}
                >
                  {u.status === 'suspended'
                    ? t('admin:users.activate')
                    : t('admin:users.suspend')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(u)}
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  {t('admin:users.edit')}
                </Button>
                {/* 自己的帳號不顯示重設密碼與刪除 */}
                {u.id !== currentUserId && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleResetPassword(u)}
                      disabled={resetPassword.isPending}
                      className="gap-1"
                      title={t('admin:users.resetPassword')}
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                      {t('admin:users.resetPassword')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(u)}
                      disabled={deleteUser.isPending}
                      className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={t('admin:users.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('admin:users.delete')}
                    </Button>
                  </>
                )}
              </div>
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

      {/* 重設密碼結果 dialog（安全 modal，取代 window.alert）*/}
      <ResetPasswordResultDialog
        open={Boolean(resetResult)}
        displayName={resetResult?.displayName ?? ''}
        tempPassword={resetResult?.tempPassword ?? ''}
        onClose={() => setResetResult(null)}
      />
    </div>
  );
}
