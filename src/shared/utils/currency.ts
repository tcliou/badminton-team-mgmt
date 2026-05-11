/**
 * 金額格式化。預設 TWD，無小數（校隊用得到的金額幾乎都是整數元）。
 * 之後若要支援多幣別，把 currency 從參數傳入即可。
 */
const TWD = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return TWD.format(n);
}

/** 不帶幣別符號的純數字（給輸入框預填用） */
export function toAmountInput(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '';
  return String(amount);
}
