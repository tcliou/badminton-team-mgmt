import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth';
import { AnnouncementsPlaceholder } from '../components/AnnouncementsPlaceholder';
import { CalendarPanel } from '../components/CalendarPanel';

export default function HomePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('home:title')}</h1>
        {profile ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('home:welcome', { name: profile.display_name })}
          </p>
        ) : null}
      </header>
      {/* 垂直排版：公告在上、行事曆在下，這樣行事曆可以拿全寬顯示更多資訊 */}
      <div className="space-y-4">
        <AnnouncementsPlaceholder />
        <CalendarPanel />
      </div>
    </div>
  );
}
