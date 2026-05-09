import { useTranslation } from 'react-i18next';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/core/auth';
import { LocaleSwitcher } from '@/core/i18n/LocaleSwitcher';

export function TopBar() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const appName = import.meta.env.VITE_APP_NAME || t('appName');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold md:text-lg">{appName}</span>
      </div>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        {profile ? (
          <>
            <div className="hidden items-center gap-2 rounded-md border bg-background px-2 py-1 text-sm sm:flex">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="font-medium">{profile.display_name}</span>
              <span className="text-xs text-muted-foreground">@{profile.username}</span>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-input px-3 text-sm hover:bg-accent"
              aria-label={t('auth.signOut')}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('auth.signOut')}</span>
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
