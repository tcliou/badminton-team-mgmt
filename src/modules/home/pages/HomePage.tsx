import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth';
import { AnnouncementsPlaceholder } from '../components/AnnouncementsPlaceholder';

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
      <div className="space-y-4">
        <AnnouncementsPlaceholder />
      </div>
    </div>
  );
}
