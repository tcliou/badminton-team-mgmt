import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  month: Date;
  setMonth: (d: Date) => void;
}

export function MonthlySummary({ month, setMonth }: Props) {
  const { t } = useTranslation();
  const monthQ = useMonthTransactions(month);
  const ytd = useYearToDateSummary(month);

  const { income, expense, balance } = useMemo(() => {
    let i = 0;
    let e = 0;
    (monthQ.data ?? []).forEach((r) => {
      if (r.direction === 'income') i += Number(r.amount);
      else e += Number(r.amount);
    });
    return { income: i, expense: e, balance: i - e };
  }, [monthQ.data]);

  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="prev month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="font-medium">
            {t('finance:ledger.month')} {format(month, 'yyyy / MM')}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label={t('finance:ledger.income')} value={income} positive />
        <Stat label={t('finance:ledger.expense')} value={expense} positive={false} />
        <Stat label={t('finance:ledger.balance')} value={balance} highlight />
      </div>
      {ytd.data ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('finance:ledger.yearTotal')}: {t('finance:ledger.income')}{' '}
          {formatCurrency(ytd.data.income)} / {t('finance:ledger.expense')}{' '}
          {formatCurrency(ytd.data.expense)} / {t('finance:ledger.balance')}{' '}
          {formatCurrency(ytd.data.income - ytd.data.expense)}
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  positive,
  highlight,
}: {
  label: string;
  value: number;
  positive?: boolean;
  highlight?: boolean;
}) {
  let color = 'text-foreground';
  if (highlight) color = value >= 0 ? 'text-emerald-600' : 'text-rose-600';
  else if (positive === true) color = 'text-emerald-600';
  else if (positive === false) color = 'text-rose-600';
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}
