import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';

/** 格式化為 yyyy-MM-dd（給 input[type=date] 與 PostgreSQL date 欄位） */
export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'yyyy-MM-dd');
}

/** 格式化為 yyyy-MM-ddTHH:mm（給 input[type=datetime-local]） */
export function toDateTimeInputValue(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** 把 datetime-local 字串轉為 ISO（會帶時區） */
export function fromDateTimeInputValue(value: string): string {
  return new Date(value).toISOString();
}

/** 顯示用：yyyy/MM/dd HH:mm */
export function formatDateTime(d: Date | string | null | undefined, fmt = 'yyyy/MM/dd HH:mm'): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, fmt);
}

/** 取得包含某日的整週 (週一為一週之始) */
export function weekRangeOf(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/** 兩段時間是否有重疊 */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return (
    isWithinInterval(aStart, { start: bStart, end: bEnd }) ||
    isWithinInterval(aEnd, { start: bStart, end: bEnd }) ||
    isWithinInterval(bStart, { start: aStart, end: aEnd })
  );
}

export interface RecurrenceRule {
  /** 起始日期 (yyyy-MM-dd) */
  startDate: string;
  /** 開始時間 (HH:mm) */
  startTime: string;
  /** 結束時間 (HH:mm) */
  endTime: string;
  /** 重複的星期幾，0 = 週日；例 [2,5] 代表每週二與週五 */
  weekdays: number[];
  /** 共重複幾週 */
  weeks: number;
}

/**
 * 把週期性規則展開成個別 datetime-range 列表。
 * 例如「2026/05/12 起，每週二、五 19:00–21:00 共 8 週」展開為 16 筆 (start, end)。
 */
export function expandRecurrence(rule: RecurrenceRule): Array<{ start: Date; end: Date }> {
  const out: Array<{ start: Date; end: Date }> = [];
  const baseDate = parseISO(rule.startDate);
  for (let w = 0; w < rule.weeks; w++) {
    const weekStart = addWeeks(baseDate, w);
    for (const wd of rule.weekdays) {
      // 計算該週的目標星期幾
      const offset = (wd - weekStart.getDay() + 7) % 7;
      const day = addDays(weekStart, offset);
      const [sh, sm] = rule.startTime.split(':').map(Number);
      const [eh, em] = rule.endTime.split(':').map(Number);
      const start = new Date(day);
      start.setHours(sh ?? 0, sm ?? 0, 0, 0);
      const end = new Date(day);
      end.setHours(eh ?? 0, em ?? 0, 0, 0);
      out.push({ start, end });
    }
  }
  return out;
}
