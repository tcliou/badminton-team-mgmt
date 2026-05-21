import { useTranslation } from 'react-i18next';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/Button';
import { useRangeTransactions, useYearToDateSummary } from '../api/transactionsApi';
import { exportSheet, printCurrentPage } from '@/shared/utils/exportSheet';
import { summarizeTransactions } from '@/shared/utils/financeSummary';

interface Props {
  dateRange: { start: Date; end: Date };
  teamName: string;
}

/**
 * 匯出工具列：Excel 與列印 / PDF。
 * Excel 走 SheetJS 寫 .xlsx，瀏覽器直接下載。
 * 列印走 window.print()，搭配 LedgerPrintView 的 print:block 樣式。
 */
export function LedgerExportBar({ dateRange, teamName }: Props) {
  const { t } = useTranslation();
  const rangeQ = useRangeTransactions(dateRange.start, dateRange.end);
  const ytd = useYearToDateSummary(dateRange.start);

  const handleExportXlsx = () => {
    const txs = rangeQ.data ?? [];
    const summary = summarizeTransactions(txs);
    const rangeLabel = `${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}`;

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

    // 第一張 sheet 放分類摘要
    const categoryData = txs
      .filter((tx) => tx.direction === 'expense')
      .reduce((acc, tx) => {
        const cat = tx.category || '未分類';
        acc[cat] = (acc[cat] || 0) + Number(tx.amount);
        return acc;
      }, {} as Record<string, number>);

    const summaryRows: Array<Array<string | number>> = [
      ['報表區間', `${format(dateRange.start, 'yyyy/MM/dd')} ~ ${format(dateRange.end, 'yyyy/MM/dd')}`],
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

    summaryRows.push(['', '']);
    summaryRows.push(['支出類別', '金額']);
    Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, val]) => {
        summaryRows.push([cat, val]);
      });

    exportSheet(
      [
        { name: `總結與分類分析`, headers: ['項目', '數値'], rows: summaryRows },
        { name: `收支明細`, headers, rows },
      ],
      `${teamName}-ledger-${rangeLabel}.xlsx`,
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportXlsx}
        disabled={rangeQ.isLoading}
        className="gap-1"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t('finance:export.xlsx')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => printCurrentPage()}
        disabled={rangeQ.isLoading}
        className="gap-1"
      >
        <Printer className="h-4 w-4" aria-hidden />
        {t('finance:export.print')}
      </Button>
    </div>
  );
}
