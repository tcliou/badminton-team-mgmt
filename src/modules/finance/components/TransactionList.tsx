import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { useMonthTransactions } from '../api/transactionsApi';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';
import type { FinanceTransactionRow } from '@/core/supabase/types';

interface Props {
  month: Date;
  onEdit: (row: FinanceTransactionRow) => void;
}

export function TransactionList({ month, onEdit }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useMonthTransactions(month);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('finance:ledger.empty')} />;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">{t('finance:ledger.fields.occurredOn')}</th>
            <th className="px-3 py-2">{t('finance:ledger.fields.direction')}</th>
            <th className="px-3 py-2">{t('finance:ledger.fields.category')}</th>
            <th className="px-3 py-2">{t('finance:ledger.fields.item')}</th>
            <th className="px-3 py-2 text-right">{t('finance:ledger.fields.amount')}</th>
            <th className="px-3 py-2">{t('finance:ledger.fields.counterparty')}</th>
            <th className="px-3 py-2 w-px"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((tx) => (
            <tr key={tx.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 whitespace-nowrap">{tx.occurred_on}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    tx.direction === 'income'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800',
                  )}
                >
                  {t(`finance:ledger.${tx.direction}`)}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{tx.category ?? '—'}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{tx.item}</span>
                  {tx.linked_payment_record_id ? (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800">
                      {t('finance:ledger.fromPaymentBadge')}
                    </span>
                  ) : null}
                </div>
                {tx.note ? (
                  <p className="text-xs text-muted-foreground">{tx.note}</p>
                ) : null}
              </td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium whitespace-nowrap',
                  tx.direction === 'income' ? 'text-emerald-700' : 'text-rose-700',
                )}
              >
                {formatCurrency(tx.amount)}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{tx.counterparty ?? '—'}</td>
              <td className="px-3 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(tx)}
                  aria-label={t('finance:ledger.edit')}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
