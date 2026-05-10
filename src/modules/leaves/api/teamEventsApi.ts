import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { supabase } from '@/core/supabase/client';
import { QK } from '@/shared/utils/queryKeys';
import type { CalendarEventRow } from '@/core/supabase/types';

/** 取得未來 N 天內的球隊行程，給請假表單下拉選擇「影響的事件」 */
export function useUpcomingTeamEvents(days = 14) {
  const now = new Date();
  const end = addDays(now, days);
  return useQuery({
    queryKey: QK.calendar.teamRange(now.toISOString().slice(0, 10), end.toISOString().slice(0, 10)),
    queryFn: async (): Promise<CalendarEventRow[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', end.toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEventRow[];
    },
    staleTime: 1000 * 60,
  });
}
