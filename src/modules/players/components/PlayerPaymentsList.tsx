import { useTranslation } from 'react-i18next';
import { usePlayerPayments } from '../api/playerPaymentsApi';
import { PaymentStatusBadge } from '@/modules/payments/components/PaymentStatusBadge';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { cn } from '@/shared/utils/cn';

interface Props {
  playerId: string;
}

export function PlayerPaymentsList({ playerId }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = usePlayerPayments(playerId);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('common.empty')} />;

  return (
    <ul className="divide-y text-sm">
      {data.map(({ item, record }) => {
        const status = !record ? 'unpaid' : record.status;
        return (
          <li
            key={item.id}
            className={cn(
              'flex flex-wrap items-start justify-between gap-2 py-2',
              status === 'confirmed' && 'opacity-70',
            )}
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-primary">{formatCurrency(item.amount)}</span>
                <PaymentStatusBadge status={status} />
              </p>
              <p className="text-xs text-muted-foreground">
                {item.due_date ? `${t('finance:items.due', { date: item.due_date })}` : ''}
                {record
                  ? ` · ${t(`payments:channel.${record.channel}`)} · ${formatDateTime(record.paid_at)}`
                  : ''}
              </p>
              {status === 'rejected' && record?.note ? (
                <p className="text-xs text-rose-600">
                  {t('payments:rejectReason', { reason: record.note })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
