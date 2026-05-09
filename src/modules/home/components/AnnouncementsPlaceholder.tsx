import { useTranslation } from 'react-i18next';
import { Megaphone, Pin } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

export function AnnouncementsPlaceholder() {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Megaphone className="h-5 w-5 text-primary" aria-hidden />
          {t('home:sections.announcements')}
        </h2>
      </header>
      <div className="space-y-3">
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Pin className="h-3.5 w-3.5" aria-hidden />
            {t('home:sections.pinned')}
          </p>
          <EmptyState
            title={t('common.empty')}
            description={t('home:placeholder.announcements')}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t('home:sections.general')}
          </p>
          <EmptyState title={t('common.empty')} />
        </div>
      </div>
    </section>
  );
}
