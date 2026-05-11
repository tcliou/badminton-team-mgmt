import * as XLSX from 'xlsx';

/**
 * 把 rows + headers 寫成 .xlsx 檔下載。
 * Excel / Google Sheets / Numbers 都能直接打開。
 *
 * 為什麼用 SheetJS：
 *   - 純前端產出（不需 server）
 *   - 一個函式同時支援 .xlsx / .csv（看副檔名）
 *   - bundle ~150KB（只有匯出時才會 lazy 載入，平時不影響）
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
        const s = cell == null ? '' : String(cell);
        return Math.max(acc, displayWidth(s));
      }, 0);
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(s.name));
  }
  // SheetJS 會根據副檔名自動決定格式
  XLSX.writeFile(wb, fileName);
}

/** 中文字算 2 寬，其他 1 寬，估出大致欄寬 */
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    w += /[一-鿿　-〿＀-￯]/.test(ch) ? 2 : 1;
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
