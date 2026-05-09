import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { PATHS } from '@/core/router/paths';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Compass className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">{t('errors.notFoundTitle')}</h1>
      <p className="max-w-md text-muted-foreground">{t('errors.notFoundDesc')}</p>
      <Link
        to={PATHS.Home}
        className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
      >
        {t('errors.goHome')}
      </Link>
    </div>
  );
}
