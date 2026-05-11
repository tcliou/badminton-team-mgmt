import { useTranslation } from 'react-i18next';
import { useMyPaymentHistory } from '../api/myPaymentsApi';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDateTime } from '@/shared/utils/dates';
import { formatCurrency } from '@/shared/utils/currency';

export function MyPaymentHistory() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyPaymentHistory();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('payments:history.empty')} />;

  return (
    <ul className="space-y-2">
      {data.map((rec) => (
        <li key={rec.id} className="rounded-lg border bg-card p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{rec.item?.name ?? '?'}</span>
                <span className="text-primary">{formatCurrency(rec.amount)}</span>
                <PaymentStatusBadge status={rec.status} />
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`payments:channel.${rec.channel}`)} · {formatDateTime(rec.paid_at)}
              </p>
              {rec.note ? (
                <p className="text-xs text-rose-600">{rec.note}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
