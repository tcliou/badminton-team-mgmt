import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportSheet, printCurrentPage } from './exportSheet';

// Mock ExcelJS 避免實際寫 binary
// ExcelJS 是 CJS default export：import ExcelJS from 'exceljs' → ExcelJS.Workbook
const mockAddRow = vi.fn();
const mockAddWorksheet = vi.fn(() => ({
  addRow: mockAddRow,
  columns: [],
}));
const mockWriteBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(0)));

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn().mockImplementation(() => ({
      addWorksheet: mockAddWorksheet,
      xlsx: { writeBuffer: mockWriteBuffer },
    })),
  },
}));

// Mock browser APIs（jsdom 沒有 URL.createObjectURL）
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
});

// Mock document.createElement('a').click
const mockClick = vi.fn();
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'a') {
    return { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
  }
  return document.createElement(tag);
});

describe('exportSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('呼叫 Workbook.xlsx.writeBuffer 並觸發下載', async () => {
    await exportSheet(
      [{ name: 'Sheet1', headers: ['日期', '金額'], rows: [['2026-01', 1000]] }],
      'test.xlsx',
    );
    expect(mockWriteBuffer).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('多個 sheet 各自呼叫 addWorksheet', async () => {
    await exportSheet(
      [
        { name: 'A', headers: ['col'], rows: [] },
        { name: 'B', headers: ['col'], rows: [] },
      ],
      'multi.xlsx',
    );
    expect(mockAddWorksheet).toHaveBeenCalledTimes(2);
  });

  it('sheet name 含非法字元時被替換為底線', async () => {
    await exportSheet([{ name: 'test/name', headers: [], rows: [] }], 'out.xlsx');
    expect(mockAddWorksheet).toHaveBeenCalledWith('test_name');
  });

  it('sheet name 超過 31 字時截斷', async () => {
    const longName = 'a'.repeat(40);
    await exportSheet([{ name: longName, headers: [], rows: [] }], 'out.xlsx');
    expect(mockAddWorksheet).toHaveBeenCalledWith('a'.repeat(31));
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
