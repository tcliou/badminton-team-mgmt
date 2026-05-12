import { describe, it, expect } from 'vitest';
import { formatCurrency, toAmountInput } from './currency';

describe('formatCurrency', () => {
  it('整數金額格式化成 TWD', () => {
    const result = formatCurrency(1000);
    // Intl 在不同環境可能回傳 NT$1,000 或 $1,000，統一只驗 1,000
    expect(result).toMatch(/1,000/);
  });

  it('0 元格式化正常', () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });

  it('字串型別的數字正確轉換', () => {
    expect(formatCurrency('500')).toMatch(/500/);
  });

  it('null 回傳 em dash', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('undefined 回傳 em dash', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('空字串回傳 em dash', () => {
    expect(formatCurrency('')).toBe('—');
  });

  it('非數字字串回傳 em dash', () => {
    expect(formatCurrency('abc')).toBe('—');
  });

  it('負數正常格式化', () => {
    const result = formatCurrency(-200);
    expect(result).toMatch(/200/);
  });
});

describe('toAmountInput', () => {
  it('數字轉成字串', () => {
    expect(toAmountInput(300)).toBe('300');
  });

  it('null 回傳空字串', () => {
    expect(toAmountInput(null)).toBe('');
  });

  it('undefined 回傳空字串', () => {
    expect(toAmountInput(undefined)).toBe('');
  });

  it('空字串回傳空字串', () => {
    expect(toAmountInput('')).toBe('');
  });

  it('字串數字直接回傳原字串', () => {
    expect(toAmountInput('250')).toBe('250');
  });
});
