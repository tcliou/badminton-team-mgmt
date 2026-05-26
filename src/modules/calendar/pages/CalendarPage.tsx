import { CalendarPanel } from '../components/CalendarPanel';
import { useTranslation } from 'react-i18next';

export function CalendarPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('calendar:title')}</h1>
      </header>
      <CalendarPanel />
    </div>
  );
}
