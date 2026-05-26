import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navModules } from '@/core/router/moduleRegistry';
import { useAuthStore } from '@/core/store/authStore';
import { hasPermission } from '@/core/acl/permissions';
import { useTeamSettings } from '@/core/api/settingsApi';
import { cn } from '@/shared/utils/cn';
import { resolveNavIcon } from './navIcons';

interface BottomNavProps {
  className?: string;
}

/** 手機底部導航：最多顯示 5 個主要模組，超出移到「更多」 */
export function BottomNav({ className }: BottomNavProps) {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const perms = profile?.permission_keys ?? [];
  const { data: settings } = useTeamSettings();
  
  const baseModules = navModules().filter(
    (m) => !m.permissionKey || hasPermission(perms, m.permissionKey),
  );

  const sortedModules = settings?.nav_order
    ? [...baseModules].sort((a, b) => {
        const iA = settings.nav_order.indexOf(a.id);
        const iB = settings.nav_order.indexOf(b.id);
        if (iA >= 0 && iB >= 0) return iA - iB;
        if (iA >= 0) return -1;
        if (iB >= 0) return 1;
        return (a.order ?? 100) - (b.order ?? 100);
      })
    : baseModules;

  const visible = sortedModules.slice(0, 5);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 grid border-t bg-card safe-area-bottom',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${visible.length || 1}, minmax(0, 1fr))` }}
      aria-label="Bottom navigation"
    >
      {visible.map((m) => {
        const Icon = resolveNavIcon(m.navIcon);
        const path = m.routes[0]?.path ?? '/';
        return (
          <NavLink
            key={m.id}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="leading-none">{t(m.navLabelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
