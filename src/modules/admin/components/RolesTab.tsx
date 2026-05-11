import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  useCreateRole,
  useDeleteRole,
  useRoleAssignmentCounts,
} from '../api/adminApi';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { RolePermissionsEditor } from './RolePermissionsEditor';
import { Loading } from '@/shared/components/Loading';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';

export function RolesTab() {
  const { t } = useTranslation();
  const roles = useAllRoles();
  const counts = useRoleAssignmentCounts();
  const create = useCreateRole();
  const del = useDeleteRole();
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), description: desc.trim() || undefined });
    setName('');
    setDesc('');
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    const c = counts.data?.[roleId] ?? 0;
    if (!window.confirm(t('admin:roles.deleteConfirm', { name: roleName, count: c }))) return;
    await del.mutateAsync(roleId);
  };

  if (roles.isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      {/* 新增自訂角色 */}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin:roles.newRole')}
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder={t('admin:roles.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:max-w-xs"
          />
          <Input
            placeholder={t('admin:roles.descriptionPlaceholder')}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <Button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || create.isPending}
          >
            {t('admin:roles.create')}
          </Button>
        </div>
      </section>

      {/* 角色列表，每筆可展開設定權限 */}
      <ul className="space-y-2">
        {(roles.data ?? []).map((r) => {
          const open = openId === r.id;
          const cnt = counts.data?.[r.id] ?? 0;
          return (
            <li key={r.id} className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.name}</span>
                    {r.is_system ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                        {t('admin:roles.system')}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">· {cnt} 人</span>
                  </p>
                  {r.description ? (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {!r.is_system ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(r.id, r.name)}
                      className="gap-1 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('admin:roles.delete')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="gap-1"
                  >
                    {open ? (
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {t('admin:roles.permissions')}
                  </Button>
                </div>
              </div>
              {open ? (
                <div className={cn('border-t bg-background/40 p-3')}>
                  <RolePermissionsEditor roleId={r.id} readOnly={r.name === 'admin'} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
