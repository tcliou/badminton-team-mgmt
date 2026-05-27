import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { useRangeTransactions, useActiveProfiles } from '../api/transactionsApi';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';
import type { FinanceTransactionRow } from '@/core/supabase/types';

interface Props {
  dateRange: { start: Date; end: Date };
  onEdit: (row: FinanceTransactionRow) => void;
}

export function TransactionList({ dateRange, onEdit }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useRangeTransactions(dateRange.start, dateRange.end);
  const { data: profiles } = useActiveProfiles();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('finance:ledger.empty')} />;

  return (
    <div className="space-y-4">
      {/* 手機版卡片視圖 (Mobile Card View) */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((tx) => (
          <div key={tx.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{tx.occurred_on}</div>
                <div className="mt-0.5 font-medium">{tx.item}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground">{tx.category ?? '—'}</span>
                  {tx.linked_payment_record_id ? (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800">
                      {t('finance:ledger.fromPaymentBadge')}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'font-bold',
                    tx.direction === 'income' ? 'text-emerald-700' : 'text-rose-700'
                  )}
                >
                  {formatCurrency(tx.amount)}
                </div>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]',
                    tx.direction === 'income'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  )}
                >
                  {t(`finance:ledger.${tx.direction}`)}
                </span>
              </div>
            </div>

            {(tx.counterparty || tx.advanced_by_user_id || tx.note) && (
              <div className="border-t pt-2 text-sm">
                {tx.note && <p className="mb-1 text-xs text-muted-foreground">{tx.note}</p>}
                {tx.counterparty && <div>{tx.counterparty}</div>}
                {tx.advanced_by_user_id && (
                  <div className="text-xs text-blue-600">
                    代墊：{profiles?.find((p) => p.id === tx.advanced_by_user_id)?.display_name || tx.advanced_by_user_id.slice(0, 8)}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-1 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onEdit(tx)} className="h-8">
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t('common.edit', { defaultValue: '編輯' })}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面版表格視圖 (Desktop Table View) */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{t('finance:ledger.fields.occurredOn')}</th>
              <th className="px-3 py-2">{t('finance:ledger.fields.direction')}</th>
              <th className="px-3 py-2">{t('finance:ledger.fields.category')}</th>
              <th className="px-3 py-2">{t('finance:ledger.fields.item')}</th>
              <th className="px-3 py-2 text-right">{t('finance:ledger.fields.amount')}</th>
              <th className="px-3 py-2">{t('finance:ledger.fields.counterparty')} / 代墊人</th>
              <th className="w-px px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-3 py-2">{tx.occurred_on}</td>
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
                    'whitespace-nowrap px-3 py-2 text-right font-medium',
                    tx.direction === 'income' ? 'text-emerald-700' : 'text-rose-700',
                  )}
                >
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {tx.counterparty ? <div>{tx.counterparty}</div> : null}
                  {tx.advanced_by_user_id ? (
                    <div className="text-xs text-blue-600">
                      代墊：{profiles?.find((p) => p.id === tx.advanced_by_user_id)?.display_name || tx.advanced_by_user_id.slice(0, 8)}
                    </div>
                  ) : null}
                  {!tx.counterparty && !tx.advanced_by_user_id ? '—' : null}
                </td>
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
    </div>
  );
}
