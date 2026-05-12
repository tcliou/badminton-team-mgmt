import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportSheet, printCurrentPage } from './exportSheet';

// Mock SheetJS 避免實際寫 binary
vi.mock('xlsx', () => {
  const ws = {};
  const wb = { SheetNames: [], Sheets: {} };
  return {
    utils: {
      book_new: vi.fn(() => wb),
      aoa_to_sheet: vi.fn(() => ws),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

describe('exportSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('呼叫 XLSX.writeFile 並帶入 fileName', () => {
    exportSheet(
      [{ name: 'Sheet1', headers: ['日期', '金額'], rows: [['2026-01', 1000]] }],
      'test.xlsx',
    );
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test.xlsx');
  });

  it('多個 sheet 各自呼叫 book_append_sheet', () => {
    exportSheet(
      [
        { name: 'A', headers: ['col'], rows: [] },
        { name: 'B', headers: ['col'], rows: [] },
      ],
      'multi.xlsx',
    );
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
  });

  it('sheet name 含非法字元時被替換為底線', () => {
    exportSheet([{ name: 'test/name', headers: [], rows: [] }], 'out.xlsx');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'test_name',
    );
  });

  it('sheet name 超過 31 字時截斷', () => {
    const longName = 'a'.repeat(40);
    exportSheet([{ name: longName, headers: [], rows: [] }], 'out.xlsx');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'a'.repeat(31),
    );
  });
});

describe('printCurrentPage', () => {
  it('呼叫 window.print()', () => {
    const spy = vi.spyOn(window, 'print').mockImplementation(() => {});
    printCurrentPage();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
