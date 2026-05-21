import ExcelJS from 'exceljs';

/**
 * 把 rows + headers 寫成 .xlsx 檔下載。
 * Excel / Google Sheets / Numbers 都能直接打開。
 *
 * 為什麼改用 ExcelJS（取代 SheetJS/xlsx）：
 *   - SheetJS v0.18.x 有 HIGH CVE（Prototype Pollution、ReDoS）
 *   - SheetJS v0.19+ 已改為商業授權，無法使用
 *   - ExcelJS 是 MIT 授權，無已知 HIGH/CRITICAL CVE
 *
 * @param sheets - 多 sheet 結構：每個 entry 一張 worksheet
 * @param fileName - 含副檔名（.xlsx）
 */
export async function exportSheet(
  sheets: Array<{
    name: string;
    headers: string[];
    rows: Array<Array<string | number | null>>;
  }>,
  fileName: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();

  for (const s of sheets) {
    const ws = wb.addWorksheet(sanitizeSheetName(s.name));

    // header 列
    ws.addRow(s.headers);

    // 資料列
    for (const row of s.rows) {
      ws.addRow(row.map((cell) => (cell == null ? '' : cell)));
    }

    // 自動欄寬：取每欄的最長視覺寬度 + 2，上限 40
    const allRows = [s.headers, ...s.rows];
    ws.columns = s.headers.map((_, colIdx) => {
      const maxLen = allRows.reduce((acc, row) => {
        const cell = row[colIdx];
        const txt = cell == null ? '' : String(cell);
        return Math.max(acc, displayWidth(txt));
      }, 0);
      return { width: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
  }

  // 產出 ArrayBuffer → Blob → 觸發下載
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 寬字元的 Unicode 範圍。用數值表達避免源碼出現實體寬字元
 * （例如 U+3000 全形空白會被 ESLint no-irregular-whitespace 擋下）。
 *   0x3000-0x303F  CJK Symbols & Punctuation（含全形空白）
 *   0x3040-0x309F  Hiragana
 *   0x30A0-0x30FF  Katakana
 *   0x4E00-0x9FFF  CJK Unified Ideographs
 *   0xAC00-0xD7AF  Hangul Syllables
 *   0xFF00-0xFFEF  Halfwidth and Fullwidth Forms
 */
const WIDE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x3000, 0x303f],
  [0x3040, 0x309f],
  [0x30a0, 0x30ff],
  [0x4e00, 0x9fff],
  [0xac00, 0xd7af],
  [0xff00, 0xffef],
];

function isWideCodePoint(cp: number): boolean {
  for (const [lo, hi] of WIDE_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

/** 估算字串「視覺寬度」用於計算 Excel 欄寬：寬字元 2 格、其他 1 格 */
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    w += isWideCodePoint(cp) ? 2 : 1;
  }
  return w;
}

/** Excel sheet name 不能包含 \ / ? * [ ] : 且不能 > 31 字 */
function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
}

/** 觸發瀏覽器列印目前頁面（會跳出列印對話框，使用者可選「另存為 PDF」） */
export function printCurrentPage(): void {
  window.print();
}
