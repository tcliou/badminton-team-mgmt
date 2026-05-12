import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useRangeTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { summarizeTransactions } from '@/shared/utils/financeSummary';
import { formatCurrency } from '@/shared/utils/currency';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * 列印用視圖，用 @media print 控制：螢幕上只顯示按鈕、列印時隱藏 UI、
 * 把表格延展到全頁，含表頭表尾與簽核欄。
 *
 * 使用方式：在 FinancePage ledger tab 嵌入 <LedgerPrintView month={...}/> ，
 * 點「列印 / PDF」呼叫 window.print()。瀏覽器列印對話框可選「另存 PDF」。
 * index.css 的 @media print 會隱藏所有 UI，只顯示 .print:block 的元素。
 */
export function LedgerPrintView({ dateRange, teamName }: { dateRange: { start: Date; end: Date }; teamName: string }) {
  const { t } = useTranslation('finance');
  const { data } = useRangeTransactions(dateRange.start, dateRange.end);
  const ytd = useYearToDateSummary(dateRange.start);
  const summary = summarizeTransactions(data ?? []);

  const categoryData = (data ?? [])
    .filter((tx) => tx.direction === 'expense')
    .reduce((acc, tx) => {
      const cat = tx.category || '未分類';
      const existing = acc.find(item => item.name === cat);
      if (existing) {
        existing.value += Number(tx.amount);
      } else {
        acc.push({ name: cat, value: Number(tx.amount) });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="hidden print:block print:p-6 print:text-black">
      {/* 表頭 */}
      <header className="mb-4 border-b border-black pb-2">
        <h1 className="text-2xl font-bold">
          {teamName} — {t('print.title')}
        </h1>
        <p className="text-sm">
          區間：{format(dateRange.start, 'yyyy/MM/dd')} ~ {format(dateRange.end, 'yyyy/MM/dd')}
        </p>
        <p className="text-xs text-gray-700">
          {t('print.printedAt')}
          {format(new Date(), 'yyyy/MM/dd HH:mm')}
        </p>
      </header>

      {/* 類別分析圖表與總結 */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-2">收支總結</h2>
          <p className="text-base">{t('ledger.income')} {formatCurrency(summary.income)}</p>
          <p className="text-base">{t('ledger.expense')} {formatCurrency(summary.expense)}</p>
          <p className="text-base font-bold mt-2 pt-2 border-t border-gray-300">
            {t('ledger.balance')} {formatCurrency(summary.balance)}
          </p>
        </div>
        {categoryData.length > 0 && (
          <div className="w-1/2 h-48 border-l border-gray-300 pl-4">
            <h2 className="text-sm font-bold text-center mb-1">支出類別分析</h2>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: unknown) => {
                    const { name, percent } = props as { name: string; percent?: number };
                    return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 收支明細表格 */}
      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.occurredOn')}
            </th>
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.direction')}
            </th>
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.category')}
            </th>
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.item')}
            </th>
            <th className="border border-black px-2 py-1 text-right">
              {t('ledger.fields.amount')}
            </th>
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.counterparty')}
            </th>
            <th className="border border-black px-2 py-1 text-left">
              {t('ledger.fields.note')}
            </th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((tx) => (
            <tr key={tx.id}>
              <td className="border border-black px-2 py-1">{tx.occurred_on}</td>
              <td className="border border-black px-2 py-1">
                {tx.direction === 'income' ? t('ledger.income') : t('ledger.expense')}
              </td>
              <td className="border border-black px-2 py-1">{tx.category ?? ''}</td>
              <td className="border border-black px-2 py-1">{tx.item}</td>
              <td className="border border-black px-2 py-1 text-right">
                {formatCurrency(tx.amount)}
              </td>
              <td className="border border-black px-2 py-1">{tx.counterparty ?? ''}</td>
              <td className="border border-black px-2 py-1">{tx.note ?? ''}</td>
            </tr>
          ))}

          <tr className="border-t-2 border-black font-bold">
            <td className="border border-black px-2 py-1" colSpan={4}>
              區間合計
            </td>
            <td className="border border-black px-2 py-1 text-right" colSpan={3}>
              {t('ledger.income')} {formatCurrency(summary.income)} /{' '}
              {t('ledger.expense')} {formatCurrency(summary.expense)} /{' '}
              {t('ledger.balance')} {formatCurrency(summary.balance)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 年度累計摘要 */}
      {ytd.data ? (
        <p className="mb-6 text-sm">
          {t('print.yearSummary')}：
          {t('ledger.income')} {formatCurrency(ytd.data.income)} /{' '}
          {t('ledger.expense')} {formatCurrency(ytd.data.expense)} /{' '}
          {t('ledger.balance')} {formatCurrency(ytd.data.income - ytd.data.expense)}
        </p>
      ) : null}

      {/* 簽核欄 */}
      <footer className="mt-12 grid grid-cols-3 gap-8 text-sm">
        <SignatureBlock label={t('print.signPrepared')} />
        <SignatureBlock label={t('print.signReviewed')} />
        <SignatureBlock label={t('print.signApproved')} />
      </footer>
    </div>
  );
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div>
      <div className="h-14 border-b border-black" />
      <p className="mt-1 text-center text-xs">{label}</p>
    </div>
  );
}
