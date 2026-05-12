import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { PaymentItemList } from '../components/PaymentItemList';
import { PaymentItemForm } from '../components/PaymentItemForm';
import { ReconcileList } from '../components/ReconcileList';
import { TransactionList } from '../components/TransactionList';
import { TransactionForm } from '../components/TransactionForm';
import { MonthlySummary } from '../components/MonthlySummary';
import { LedgerExportBar } from '../components/LedgerExportBar';
import { LedgerPrintView } from '../components/LedgerPrintView';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { FinanceTransactionRow, PaymentItemRow } from '@/core/supabase/types';

type Tab = 'items' | 'reconcile' | 'ledger';

export default function FinancePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('items');

  // -- items tab state --
  const [creatingItem, setCreatingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentItemRow | null>(null);

  // -- ledger tab state --
  const initialDateRange = useMemo(() => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }), []);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransactionRow | null>(null);
  const [defaultTxDirection, setDefaultTxDirection] = useState<'income' | 'expense'>('income');

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('finance:title')}</h1>
      </header>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {(['items', 'reconcile', 'ledger'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
            aria-pressed={tab === s}
          >
            {t(`finance:tabs.${s}`)}
          </button>
        ))}
      </div>

      {/* ── 應收費用 ── */}
      {tab === 'items' ? (
        <div className="space-y-3">
          {creatingItem || editingItem ? (
            <PaymentItemForm
              editing={editingItem}
              onDone={() => {
                setCreatingItem(false);
                setEditingItem(null);
              }}
            />
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => setCreatingItem(true)} className="gap-1">
                <Plus className="h-4 w-4" aria-hidden />
                {t('finance:items.new')}
              </Button>
            </div>
          )}
          <PaymentItemList onEdit={(row) => setEditingItem(row)} />
        </div>
      ) : null}

      {/* ── 對帳 ── */}
      {tab === 'reconcile' ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">{t('finance:reconcile.title')}</h2>
          <ReconcileList />
        </div>
      ) : null}

      {/* ── 收支總帳 ── */}
      {tab === 'ledger' ? (
        <div className="space-y-3">
          <MonthlySummary dateRange={dateRange} setDateRange={setDateRange} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <LedgerExportBar
              dateRange={dateRange}
              teamName={import.meta.env.VITE_APP_NAME || 'Team'}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingTx(null);
                  setDefaultTxDirection('income');
                  setTxDialogOpen(true);
                }}
                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4" aria-hidden />
                新增收入
              </Button>
              <Button
                onClick={() => {
                  setEditingTx(null);
                  setDefaultTxDirection('expense');
                  setTxDialogOpen(true);
                }}
                className="gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4" aria-hidden />
                新增支出
              </Button>
            </div>
          </div>
          <TransactionList
            dateRange={dateRange}
            onEdit={(tx) => {
              setEditingTx(tx);
              setTxDialogOpen(true);
            }}
          />
          <TransactionForm
            open={txDialogOpen}
            onClose={() => setTxDialogOpen(false)}
            editing={editingTx}
            defaultMonth={dateRange.start}
            defaultDirection={defaultTxDirection}
          />
          {/* 列印視圖：螢幕看不到，print 時取代整頁 */}
          <LedgerPrintView
            dateRange={dateRange}
            teamName={import.meta.env.VITE_APP_NAME || 'Team'}
          />
        </div>
      ) : null}
    </div>
  );
}
