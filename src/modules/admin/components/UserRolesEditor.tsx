import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useReplaceUserRoles, type UserWithRoles } from '../api/adminApi';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';

interface Props {
  open: boolean;
  user: UserWithRoles | null;
  onClose: () => void;
}

export function UserRolesEditor({ open, user, onClose }: Props) {
  const { t } = useTranslation();
  const roles = useAllRoles();
  const replace = useReplaceUserRoles();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !user) return;
    setSelected(new Set(user.role_ids));
  }, [open, user]);

  if (!open || !user) return null;

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await replace.mutateAsync({ userId: user.id, roleIds: Array.from(selected) });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-xl border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">
          {t('admin:userRolesEditor.title', { name: user.display_name })}
        </h3>
        <p className="text-xs text-muted-foreground">@{user.username}</p>

        <div className="space-y-1.5">
          {roles.data?.map((r) => (
            <label
              key={r.id}
              className="flex items-start gap-2 rounded-md border p-2 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="mt-0.5 accent-primary"
              />
              <span>
                <span className="font-medium">{r.name}</span>
                {r.is_system ? (
                  <span className="ml-1 text-xs text-muted-foreground">(system)</span>
                ) : null}
                {r.description ? (
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                ) : null}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>
            {t('admin:userRolesEditor.cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={replace.isPending}>
            {replace.isPending ? t('common.loading') : t('admin:userRolesEditor.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
