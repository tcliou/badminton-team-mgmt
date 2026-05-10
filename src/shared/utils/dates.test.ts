import { describe, it, expect } from 'vitest';
import {
  expandRecurrence,
  overlaps,
  toDateInputValue,
  toDateTimeInputValue,
  weekRangeOf,
} from './dates';

describe('dates', () => {
  it('toDateInputValue 給 yyyy-MM-dd', () => {
    expect(toDateInputValue('2026-05-10T13:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toDateInputValue(null)).toBe('');
  });

  it('toDateTimeInputValue 給 yyyy-MM-ddTHH:mm', () => {
    const v = toDateTimeInputValue(new Date('2026-05-10T13:00:00'));
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('weekRangeOf 以週一為開始', () => {
    // 2026-05-10 是週日
    const { start, end } = weekRangeOf(new Date('2026-05-10T00:00:00'));
    expect(start.getDay()).toBe(1); // Mon
    expect(end.getDay()).toBe(0); // Sun
  });

  describe('overlaps', () => {
    it('完全重疊', () => {
      const d = (s: string) => new Date(s);
      expect(
        overlaps(d('2026-05-10T10:00'), d('2026-05-10T12:00'), d('2026-05-10T11:00'), d('2026-05-10T13:00')),
      ).toBe(true);
    });
    it('完全不重疊', () => {
      const d = (s: string) => new Date(s);
      expect(
        overlaps(d('2026-05-10T10:00'), d('2026-05-10T12:00'), d('2026-05-11T10:00'), d('2026-05-11T12:00')),
      ).toBe(false);
    });
  });

  describe('expandRecurrence', () => {
    it('每週二、五 共 2 週 → 4 筆', () => {
      const result = expandRecurrence({
        startDate: '2026-05-11', // 週一
        startTime: '19:00',
        endTime: '21:00',
        weekdays: [2, 5], // 週二與週五
        weeks: 2,
      });
      expect(result).toHaveLength(4);
      // 第一筆是 2026-05-12 19:00 (週二)
      expect(result[0]?.start.getDay()).toBe(2);
      expect(result[0]?.start.getHours()).toBe(19);
      expect(result[0]?.end.getHours()).toBe(21);
    });

    it('weeks=0 → 空陣列', () => {
      expect(
        expandRecurrence({
          startDate: '2026-05-11',
          startTime: '09:00',
          endTime: '10:00',
          weekdays: [1],
          weeks: 0,
        }),
      ).toEqual([]);
    });

    it('時間欄位允許單位數小時', () => {
      const result = expandRecurrence({
        startDate: '2026-05-11',
        startTime: '9:00',
        endTime: '10:30',
        weekdays: [1],
        weeks: 1,
      });
      expect(result[0]?.start.getHours()).toBe(9);
      expect(result[0]?.end.getMinutes()).toBe(30);
    });
  });
});
