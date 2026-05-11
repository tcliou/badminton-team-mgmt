import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersTab } from '../components/UsersTab';
import { RolesTab } from '../components/RolesTab';
import { cn } from '@/shared/utils/cn';

type Tab = 'users' | 'roles';

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('admin:title')}</h1>
      </header>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {(['users', 'roles'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
            aria-pressed={tab === s}
          >
            {t(`admin:tabs.${s}`)}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersTab /> : <RolesTab />}
    </div>
  );
}
