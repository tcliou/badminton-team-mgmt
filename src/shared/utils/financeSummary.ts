import type { FinanceTransactionRow } from '@/core/supabase/types';

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
}

/**
 * 從 transactions 列表加總 income / expense / balance。
 * amount 在 DB 是 numeric → JS 拿到是 string，所以一律 Number() 轉一下；
 * 也擋住 NaN（壞資料）讓總和不會被汙染。
 */
export function summarizeTransactions(
  rows: Pick<FinanceTransactionRow, 'direction' | 'amount'>[],
): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    const n = Number(r.amount);
    if (!Number.isFinite(n)) continue;
    if (r.direction === 'income') income += n;
    else if (r.direction === 'expense') expense += n;
  }
  return { income, expense, balance: income - expense };
}
