import { format } from 'date-fns';
import { useMonthTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { summarizeTransactions } from '@/shared/utils/financeSummary';
import { formatCurrency } from '@/shared/utils/currency';

/**
 * 列印用視圖，用 @media print 控制：螢幕上只顯示按鈕、列印時隱藏 UI、
 * 把表格延展到全頁，含表頭表尾與簽核欄。
 *
 * 使用方式：在 FinancePage ledger tab 嵌入 <LedgerPrintView month={...}/>，
 * 點「列印 / PDF」呼叫 window.print()。瀏覽器列印對話框可選「另存 PDF」。
 */
export function LedgerPrintView({ month, teamName }: { month: Date; teamName: string }) {
  const { data } = useMonthTransactions(month);
  const ytd = useYearToDateSummary(month);
  const summary = summarizeTransactions(data ?? []);

  return (
    <div className="hidden print:block print:p-6 print:text-black">
      <header className="mb-4 border-b border-black pb-2">
        <h1 className="text-2xl font-bold">{teamName} — 收支總帳</h1>
        <p className="text-sm">月份：{format(month, 'yyyy / MM')}</p>
        <p className="text-xs text-gray-700">
          列印時間：{format(new Date(), 'yyyy/MM/dd HH:mm')}
        </p>
      </header>

      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="border border-black px-2 py-1 text-left">日期</th>
            <th className="border border-black px-2 py-1 text-left">收/支</th>
            <th className="border border-black px-2 py-1 text-left">類別</th>
            <th className="border border-black px-2 py-1 text-left">項目</th>
            <th className="border border-black px-2 py-1 text-right">金額</th>
            <th className="border border-black px-2 py-1 text-left">對方</th>
            <th className="border border-black px-2 py-1 text-left">備註</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((tx) => (
            <tr key={tx.id}>
              <td className="border border-black px-2 py-1">{tx.occurred_on}</td>
              <td className="border border-black px-2 py-1">
                {tx.direction === 'income' ? '收入' : '支出'}
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
              本月合計
            </td>
            <td className="border border-black px-2 py-1 text-right">
              收 {formatCurrency(summary.income)} / 支 {formatCurrency(summary.expense)} /{' '}
              結餘 {formatCurrency(summary.balance)}
            </td>
            <td className="border border-black px-2 py-1" colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {ytd.data ? (
        <p className="text-sm">
          年度累計：收 {formatCurrency(ytd.data.income)} / 支{' '}
          {formatCurrency(ytd.data.expense)} / 結餘{' '}
          {formatCurrency(ytd.data.income - ytd.data.expense)}
        </p>
      ) : null}

      <footer className="mt-12 grid grid-cols-3 gap-4 text-sm">
        <SignatureBlock label="製表" />
        <SignatureBlock label="覆核" />
        <SignatureBlock label="主管" />
      </footer>
    </div>
  );
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div>
      <div className="h-12 border-b border-black"></div>
      <p className="mt-1 text-center text-xs">{label}</p>
    </div>
  );
}
