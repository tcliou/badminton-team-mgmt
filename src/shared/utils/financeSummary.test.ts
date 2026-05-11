import { describe, it, expect } from 'vitest';
import { summarizeTransactions } from './financeSummary';

describe('summarizeTransactions', () => {
  it('空陣列 → 全 0', () => {
    expect(summarizeTransactions([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('混合 income / expense 正確加總', () => {
    expect(
      summarizeTransactions([
        { direction: 'income', amount: 1000 },
        { direction: 'income', amount: 500 },
        { direction: 'expense', amount: 200 },
        { direction: 'expense', amount: 50 },
      ]),
    ).toEqual({ income: 1500, expense: 250, balance: 1250 });
  });

  it('balance 可以是負數', () => {
    expect(
      summarizeTransactions([
        { direction: 'income', amount: 100 },
        { direction: 'expense', amount: 300 },
      ]),
    ).toEqual({ income: 100, expense: 300, balance: -200 });
  });

  it('amount 是字串（Postgres numeric）也能加', () => {
    expect(
      summarizeTransactions([
        { direction: 'income', amount: '1000' as unknown as number },
        { direction: 'expense', amount: '250.5' as unknown as number },
      ]),
    ).toEqual({ income: 1000, expense: 250.5, balance: 749.5 });
  });

  it('壞資料（NaN / null）會被忽略，不污染總和', () => {
    expect(
      summarizeTransactions([
        { direction: 'income', amount: 100 },
        { direction: 'income', amount: NaN },
        { direction: 'expense', amount: null as unknown as number },
        { direction: 'expense', amount: 50 },
      ]),
    ).toEqual({ income: 100, expense: 50, balance: 50 });
  });
});
