import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useMonthTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { summarizeTransactions } from '@/shared/utils/financeSummary';
import { formatCurrency } from '@/shared/utils/currency';

/**
 * 列印用視圖，用 @media print 控制：螢幕上只顯示按鈕、列印時隱藏 UI、
 * 把表格延展到全頁，含表頭表尾與簽核欄。
 *
 * 使用方式：在 FinancePage ledger tab 嵌入 <LedgerPrintView month={...}/> ，
 * 點「列印 / PDF」呼叫 window.print()。瀏覽器列印對話框可選「另存 PDF」。
 * index.css 的 @media print 會隱藏所有 UI，只顯示 .print:block 的元素。
 */
export function LedgerPrintView({ month, teamName }: { month: Date; teamName: string }) {
  const { t } = useTranslation('finance');
  const { data } = useMonthTransactions(month);
  const ytd = useYearToDateSummary(month);
  const summary = summarizeTransactions(data ?? []);

  return (
    <div className="hidden print:block print:p-6 print:text-black">
      {/* 表頭 */}
      <header className="mb-4 border-b border-black pb-2">
        <h1 className="text-2xl font-bold">
          {teamName} — {t('print.title')}
        </h1>
        <p className="text-sm">
          {t('print.month')}
          {format(month, 'yyyy / MM')}
        </p>
        <p className="text-xs text-gray-700">
          {t('print.printedAt')}
          {format(new Date(), 'yyyy/MM/dd HH:mm')}
        </p>
      </header>

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

          {/* 本月合計列 */}
          <tr className="border-t-2 border-black font-bold">
            <td className="border border-black px-2 py-1" colSpan={4}>
              {t('print.monthTotal')}
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
