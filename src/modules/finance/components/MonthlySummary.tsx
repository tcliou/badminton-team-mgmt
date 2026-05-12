import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useRangeTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { formatCurrency } from '@/shared/utils/currency';
import { summarizeTransactions } from '@/shared/utils/financeSummary';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  dateRange: { start: Date; end: Date };
  setDateRange: (r: { start: Date; end: Date }) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function MonthlySummary({ dateRange, setDateRange }: Props) {
  const { t } = useTranslation();
  const rangeQ = useRangeTransactions(dateRange.start, dateRange.end);
  const ytd = useYearToDateSummary(dateRange.start);

  const { income, expense, balance } = useMemo(
    () => summarizeTransactions(rangeQ.data ?? []),
    [rangeQ.data],
  );

  // 計算分類統計 (僅統計支出)
  const categoryData = useMemo(() => {
    if (!rangeQ.data) return [];
    const expenses = rangeQ.data.filter(tx => tx.direction === 'expense');
    const categoryMap = new Map<string, number>();
    expenses.forEach(tx => {
      const cat = tx.category || '未分類';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(tx.amount));
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rangeQ.data]);

  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDateRange({
              start: subMonths(dateRange.start, 1),
              end: subMonths(dateRange.end, 1)
            })}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="prev month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="font-medium flex items-center gap-1 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <input 
              type="date" 
              className="bg-transparent text-center outline-none cursor-pointer"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
            />
            ~
            <input 
              type="date" 
              className="bg-transparent text-center outline-none cursor-pointer"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
            />
          </span>
          <button
            type="button"
            onClick={() => setDateRange({
              start: addMonths(dateRange.start, 1),
              end: addMonths(dateRange.end, 1)
            })}
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

      {/* 類別分析圓餅圖 */}
      {categoryData.length > 0 && (
        <div className="mt-6 pt-4 border-t h-64">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">支出類別分析</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '金額'] as any} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
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
