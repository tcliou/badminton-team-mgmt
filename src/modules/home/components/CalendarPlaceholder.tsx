import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

export function CalendarPlaceholder() {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          {t('home:sections.calendar')}
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden />
            {t('home:sections.teamEvents')}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            {t('home:sections.personalEvents')}
          </span>
        </div>
      </header>
      <EmptyState title={t('common.empty')} description={t('home:placeholder.calendar')} />
    </section>
  );
}
