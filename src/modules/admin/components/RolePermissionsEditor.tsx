import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAllPermissions,
  useRolePermissionKeys,
  useToggleRolePermission,
} from '../api/adminApi';
import { Loading } from '@/shared/components/Loading';
import { cn } from '@/shared/utils/cn';

interface Props {
  roleId: string;
  /** 系統角色不允許修改權限（避免 admin 把自己鎖死） */
  readOnly?: boolean;
}

export function RolePermissionsEditor({ roleId, readOnly }: Props) {
  const { t } = useTranslation();
  const perms = useAllPermissions();
  const enabled = useRolePermissionKeys(roleId);
  const toggle = useToggleRolePermission();

  const groups = useMemo(() => {
    const map = { page: [] as typeof perms.data, action: [] as typeof perms.data };
    (perms.data ?? []).forEach((p) => {
      if (p.category === 'page') map.page!.push(p);
      else map.action!.push(p);
    });
    return map;
  }, [perms.data]);

  const enabledSet = useMemo(() => new Set(enabled.data ?? []), [enabled.data]);

  if (perms.isLoading || enabled.isLoading) return <Loading />;

  const handleToggle = (key: string, on: boolean) => {
    if (readOnly) return;
    void toggle.mutate({ roleId, key, enabled: on });
  };

  return (
    <div className="space-y-3 text-sm">
      <Group
        title={t('admin:roles.page')}
        items={groups.page ?? []}
        enabledSet={enabledSet}
        onToggle={handleToggle}
        readOnly={Boolean(readOnly)}
      />
      <Group
        title={t('admin:roles.action')}
        items={groups.action ?? []}
        enabledSet={enabledSet}
        onToggle={handleToggle}
        readOnly={Boolean(readOnly)}
      />
      {toggle.isPending ? (
        <p className="text-xs text-muted-foreground">{t('admin:roles.saving')}</p>
      ) : null}
    </div>
  );
}

function Group({
  title,
  items,
  enabledSet,
  onToggle,
  readOnly,
}: {
  title: string;
  items: { key: string; description: string }[];
  enabledSet: Set<string>;
  onToggle: (key: string, on: boolean) => void;
  readOnly: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <fieldset className="rounded-md border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">{title}</legend>
      <div className="grid gap-1 sm:grid-cols-2">
        {items.map((p) => {
          const on = enabledSet.has(p.key);
          return (
            <label
              key={p.key}
              className={cn(
                'flex items-start gap-2 rounded-md p-1.5',
                readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent',
              )}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={readOnly}
                onChange={(e) => onToggle(p.key, e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-mono text-muted-foreground">{p.key}</span>
                <span className="block">{p.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
