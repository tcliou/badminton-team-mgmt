import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navModules } from '@/core/router/moduleRegistry';
import { useAuthStore } from '@/core/store/authStore';
import { hasPermission } from '@/core/acl/permissions';
import { useTeamSettings } from '@/core/api/settingsApi';
import { cn } from '@/shared/utils/cn';
import { resolveNavIcon } from './navIcons';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

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
    (m) => (!m.permissionKey || hasPermission(perms, m.permissionKey)) && !settings?.nav_hidden?.includes(m.id),
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

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const MAX_VISIBLE = 5;
  const needsMore = sortedModules.length > MAX_VISIBLE;
  const visible = needsMore ? sortedModules.slice(0, MAX_VISIBLE - 1) : sortedModules;
  const hidden = needsMore ? sortedModules.slice(MAX_VISIBLE - 1) : [];

  return (
    <>
      {isMoreOpen && needsMore && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm p-4 pt-12 flex flex-col slide-in-from-bottom-full animate-in duration-300 pb-24">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold">{t('common:nav.more', '更多選單')}</h2>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {hidden.map(m => {
              const Icon = resolveNavIcon(m.navIcon);
              const path = m.routes[0]?.path ?? '/';
              return (
                <NavLink
                  key={m.id}
                  to={path}
                  end={path === '/'}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4 text-center transition-colors shadow-sm',
                      isActive ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/50'
                    )
                  }
                >
                  <Icon className="h-8 w-8 mb-1" aria-hidden />
                  <span className="text-sm font-medium">{t(m.navLabelKey)}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
      
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 grid border-t bg-card safe-area-bottom pb-env-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.05)]',
          className,
        )}
        style={{ gridTemplateColumns: `repeat(${visible.length + (needsMore ? 1 : 0) || 1}, minmax(0, 1fr))` }}
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
                'flex min-h-[64px] flex-col items-center justify-center gap-1.5 px-1 py-2 text-[10px] md:text-xs font-medium transition-colors',
                isActive && !isMoreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-6 w-6 md:h-7 md:w-7 transition-transform", isActive && !isMoreOpen && "scale-110")} aria-hidden />
                <span className="leading-none text-center line-clamp-1">{t(m.navLabelKey)}</span>
              </>
            )}
          </NavLink>
        );
      })}
      
      {needsMore && (
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={cn(
            'flex min-h-[64px] flex-col items-center justify-center gap-1.5 px-1 py-2 text-[10px] md:text-xs font-medium transition-colors',
            isMoreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Menu className={cn("h-6 w-6 md:h-7 md:w-7 transition-transform", isMoreOpen && "scale-110")} aria-hidden />
          <span className="leading-none text-center">{t('common:nav.more', '更多')}</span>
        </button>
      )}
    </nav>
    </>
  );
}
