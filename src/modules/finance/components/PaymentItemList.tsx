import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { usePaymentItems } from '../api/paymentItemsApi';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';
import type { PaymentItemRow } from '@/core/supabase/types';

export function PaymentItemList({ onEdit }: { onEdit: (row: PaymentItemRow) => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePaymentItems();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('finance:items.empty')} />;

  return (
    <ul className="space-y-2">
      {data.map((it) => (
        <li
          key={it.id}
          className={cn(
            'flex items-start justify-between gap-3 rounded-lg border bg-card p-3',
            it.status === 'closed' && 'opacity-60',
          )}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{it.name}</span>
              <span className="text-sm text-primary">{formatCurrency(it.amount)}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  it.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700',
                )}
              >
                {t(`finance:items.${it.status}`)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {it.due_date
                ? t('finance:items.due', { date: it.due_date })
                : t('finance:items.noDue')}
              {it.purpose ? ` · ${it.purpose}` : ''}
            </p>
            {it.description ? (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {it.description}
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(it)}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t('common.edit')}
          </Button>
        </li>
      ))}
    </ul>
  );
}
