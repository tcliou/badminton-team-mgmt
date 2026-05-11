import { useTranslation } from 'react-i18next';
import { useMyPayments } from '../api/myPaymentsApi';
import { PaymentItemCard } from '../components/PaymentItemCard';
import { MyPaymentHistory } from '../components/MyPaymentHistory';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyPayments();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('payments:title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('payments:intro')}</p>
      </header>

      <section className="space-y-3">
        {isLoading ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t('payments:noItems')} />
        ) : (
          data.map((entry) => <PaymentItemCard key={entry.item.id} entry={entry} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t('payments:history.title')}</h2>
        <MyPaymentHistory />
      </section>
    </div>
  );
}
