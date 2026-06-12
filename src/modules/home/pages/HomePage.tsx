import { useTranslation } from 'react-i18next';
import { useAuth } from '@/core/auth';
import { AnnouncementsPlaceholder } from '../components/AnnouncementsPlaceholder';

export default function HomePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-2xl">{t('home:title')}</h1>
        {profile ? (
          <p className="mt-2 text-base text-muted-foreground">
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
