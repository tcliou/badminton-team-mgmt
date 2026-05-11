import { useTranslation } from 'react-i18next';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/Button';
import { useMonthTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { exportSheet, printCurrentPage } from '@/shared/utils/exportSheet';
import { summarizeTransactions } from '@/shared/utils/financeSummary';

interface Props {
  month: Date;
  teamName: string;
}

/**
 * 匯出工具列：Excel 與列印 / PDF。
 * Excel 走 SheetJS 寫 .xlsx，瀏覽器直接下載。
 * 列印走 window.print()，搭配 LedgerPrintView 的 print:block 樣式。
 */
export function LedgerExportBar({ month, teamName }: Props) {
  const { t } = useTranslation();
  const monthQ = useMonthTransactions(month);
  const ytd = useYearToDateSummary(month);

  const handleExportXlsx = () => {
    const txs = monthQ.data ?? [];
    const summary = summarizeTransactions(txs);
    const monthLabel = format(month, 'yyyy-MM');

    const headers = [
      t('finance:ledger.fields.occurredOn'),
      t('finance:ledger.fields.direction'),
      t('finance:ledger.fields.category'),
      t('finance:ledger.fields.item'),
      t('finance:ledger.fields.amount'),
      t('finance:ledger.fields.counterparty'),
      t('finance:ledger.fields.note'),
    ];

    const rows = txs.map((tx) => [
      tx.occurred_on,
      tx.direction === 'income' ? t('finance:ledger.income') : t('finance:ledger.expense'),
      tx.category ?? '',
      tx.item,
      Number(tx.amount),
      tx.counterparty ?? '',
      tx.note ?? '',
    ]);

    // 第二張 sheet 放本月與年度摘要
    const summaryRows: Array<Array<string | number>> = [
      [t('finance:ledger.month'), monthLabel],
      [t('finance:ledger.income'), summary.income],
      [t('finance:ledger.expense'), summary.expense],
      [t('finance:ledger.balance'), summary.balance],
    ];
    if (ytd.data) {
      summaryRows.push([
        `${t('finance:ledger.yearTotal')} ${t('finance:ledger.income')}`,
        ytd.data.income,
      ]);
      summaryRows.push([
        `${t('finance:ledger.yearTotal')} ${t('finance:ledger.expense')}`,
        ytd.data.expense,
      ]);
      summaryRows.push([
        `${t('finance:ledger.yearTotal')} ${t('finance:ledger.balance')}`,
        ytd.data.income - ytd.data.expense,
      ]);
    }

    exportSheet(
      [
        { name: `${teamName}-${monthLabel}`, headers, rows },
        { name: `${monthLabel} 摘要`, headers: ['項目', '金額'], rows: summaryRows },
      ],
      `${teamName}-ledger-${monthLabel}.xlsx`,
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportXlsx}
        disabled={monthQ.isLoading}
        className="gap-1"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t('finance:export.xlsx')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => printCurrentPage()}
        disabled={monthQ.isLoading}
        className="gap-1"
      >
        <Printer className="h-4 w-4" aria-hidden />
        {t('finance:export.print')}
      </Button>
    </div>
  );
}
