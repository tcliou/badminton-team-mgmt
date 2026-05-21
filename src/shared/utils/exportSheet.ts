import * as XLSX from 'xlsx';

/**
 * 把 rows + headers 寫成 .xlsx 檔下載。
 * Excel / Google Sheets / Numbers 都能直接打開。
 *
 * 為什麼用 SheetJS（xlsx）：
 *   - 純前端產出（不需 server），相容所有現代瀏覽器
 *   - 一個函式同時支援 .xlsx / .csv（看副檔名）
 *   - ExcelJS 雖然 MIT 授權，但依賴 Node.js fs/stream，無法在 browser bundle
 *
 * 已知 CVE 與風險評估（見 .trivyignore）：
 *   - GHSA-4r6h-8v6p-xvw6（Prototype Pollution）：僅在「解析 Excel」時觸發
 *   - GHSA-5pgg-2g8v-p4x9（ReDoS）：僅在「解析 Excel」時觸發
 *   本程式碼「只寫不讀」，永遠不接受外部 Excel 輸入，攻擊向量不存在。
 *
 * @param sheets - 多 sheet 結構：每個 entry 一張 worksheet
 * @param fileName - 含副檔名（.xlsx 或 .csv）
 */
export function exportSheet(
  sheets: Array<{
    name: string;
    headers: string[];
    rows: Array<Array<string | number | null>>;
  }>,
  fileName: string,
): void {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const aoa = [s.headers, ...s.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // 自動欄寬：每欄取該欄資料的最長字數 + 2
    ws['!cols'] = s.headers.map((_, colIdx) => {
      const maxLen = aoa.reduce((acc, row) => {
        const cell = row[colIdx];
        const txt = cell == null ? '' : String(cell);
        return Math.max(acc, displayWidth(txt));
      }, 0);
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(s.name));
  }
  // SheetJS 會根據副檔名自動決定格式
  XLSX.writeFile(wb, fileName);
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
