import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { navModules } from '@/core/router/moduleRegistry';
import { useAuthStore } from '@/core/store/authStore';
import { hasPermission } from '@/core/acl/permissions';
import { cn } from '@/shared/utils/cn';

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const perms = profile?.permission_keys ?? [];
  const modules = navModules().filter(
    (m) => !m.permissionKey || hasPermission(perms, m.permissionKey),
  );

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r bg-card',
        className,
      )}
      aria-label="Primary navigation"
    >
      <div className="border-b px-4 py-4 text-sm font-semibold">
        {import.meta.env.VITE_APP_NAME ?? t('appName')}
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {modules.map((m) => {
          const Icon =
            (m.navIcon ? (Icons as unknown as Record<string, Icons.LucideIcon>)[m.navIcon] : null) ??
            Icons.Circle;
          const path = m.routes[0]?.path ?? '/';
          return (
            <NavLink
              key={m.id}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(m.navLabelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
