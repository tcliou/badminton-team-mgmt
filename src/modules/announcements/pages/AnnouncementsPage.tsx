import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useAllAnnouncements } from '../api/announcementsApi';
import { AnnouncementForm } from '../components/AnnouncementForm';
import { AnnouncementListItem } from '../components/AnnouncementListItem';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { cn } from '@/shared/utils/cn';
import type { AnnouncementRow, AnnouncementStatus } from '@/core/supabase/types';

type Tab = AnnouncementStatus | 'all';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('all');
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useAllAnnouncements(tab);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold md:text-2xl">{t('announcements:title')}</h1>
        {!creating && !editing ? (
          <Button onClick={() => setCreating(true)} className="gap-1">
            <Plus className="h-4 w-4" aria-hidden />
            {t('announcements:form.new')}
          </Button>
        ) : null}
      </header>

      {creating ? (
        <AnnouncementForm
          onDone={() => {
            setCreating(false);
          }}
        />
      ) : null}
      {editing ? (
        <AnnouncementForm
          editing={editing}
          onDone={() => {
            setEditing(null);
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {(['all', 'published', 'scheduled', 'draft'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
            aria-pressed={tab === s}
          >
            {t(`announcements:tabs.${s}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('announcements:list.empty')} />
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <AnnouncementListItem
              key={row.id}
              row={row}
              onClickEdit={() => {
                setCreating(false);
                setEditing(row);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
