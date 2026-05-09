import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/components/EmptyState';

export default function PlayersPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">{t('players:title')}</h1>
      <EmptyState title={t('common.comingSoon')} description={t('players:comingSoon')} />
    </div>
  );
}
