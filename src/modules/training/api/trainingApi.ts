import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { QK } from '@/shared/utils/queryKeys';
import { eventBus } from '@/shared/utils/eventBus';
import { expandRecurrence, type RecurrenceRule } from '@/shared/utils/dates';
import type {
  AttendanceRow,
  AttendanceStatus,
  CalendarEventRow,
  TrainingSessionRow,
} from '@/core/supabase/types';

export type TrainingWithEvent = TrainingSessionRow & { event: CalendarEventRow | null };

/** 範圍內的訓練（含對應的 calendar_event 資料）
 *
 * 註：此處 select 字串內的 FK 關係名稱需與 Postgres 實際 constraint 名一致；
 * 因為手寫的 Database 型別沒有宣告 Relationships，Supabase v2 推不出 join shape，
 * 只能用 `as unknown as` 強制定型。Phase 4 改用 supabase gen types 自動產生時
 * 會有正確的 Relationships 並可拿掉這層 cast。
 */
export function useTrainings(rangeFrom: Date, rangeTo: Date) {
  return useQuery({
    queryKey: QK.training.list(rangeFrom.toISOString(), rangeTo.toISOString()),
    queryFn: async (): Promise<TrainingWithEvent[]> => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*, event:calendar_events!training_sessions_calendar_event_id_fkey(*)')
        .gte('event.starts_at', rangeFrom.toISOString())
        .lte('event.starts_at', rangeTo.toISOString())
        .order('event(starts_at)', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TrainingWithEvent[];
    },
  });
}

/** 單一訓練 + event */
export function useTrainingDetail(id: string | undefined) {
  return useQuery({
    queryKey: QK.training.detail(id ?? '__none__'),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*, event:calendar_events!training_sessions_calendar_event_id_fkey(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as TrainingWithEvent;
    },
  });
}

export interface CreateSingleTrainingInput {
  title: string;
  topic?: string | null;
  group_tag?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at: string;
}

export function useCreateSingleTraining() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSingleTrainingInput) => {
      // 1. 建 calendar_event
      const { data: ev, error: evErr } = await supabase
        .from('calendar_events')
        .insert({
          title: input.title,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          location: input.location ?? null,
          event_type: 'training',
          color: '#3b82f6',
          created_by: userId ?? null,
        })
        .select()
        .single();
      if (evErr) throw evErr;

      // 2. 建 training_session
      const { data: ts, error: tsErr } = await supabase
        .from('training_sessions')
        .insert({
          calendar_event_id: ev.id,
          coach_id: userId ?? null,
          topic: input.topic ?? null,
          group_tag: input.group_tag ?? null,
        })
        .select()
        .single();
      if (tsErr) throw tsErr;

      // 3. 把 calendar_event.source_id 指回 training_session.id（雙向追溯）
      await supabase.from('calendar_events').update({ source_id: ts.id }).eq('id', ev.id);

      return ts as TrainingSessionRow;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ['training'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      eventBus.emit('training:created', { trainingId: row.id });
    },
  });
}

export interface CreateRecurringTrainingInput {
  title: string;
  topic?: string | null;
  group_tag?: string | null;
  location?: string | null;
  rule: RecurrenceRule;
}

export function useCreateRecurringTraining() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRecurringTrainingInput) => {
      const occurrences = expandRecurrence(input.rule);
      if (occurrences.length === 0) return [];

      const batchId = crypto.randomUUID();

      // 1. 一次插入所有 calendar_events
      const eventsInsert = occurrences.map((o) => ({
        title: input.title,
        starts_at: o.start.toISOString(),
        ends_at: o.end.toISOString(),
        location: input.location ?? null,
        event_type: 'training' as const,
        color: '#3b82f6',
        created_by: userId ?? null,
      }));
      const { data: events, error: evErr } = await supabase
        .from('calendar_events')
        .insert(eventsInsert)
        .select();
      if (evErr) throw evErr;

      // 2. 一次插入所有 training_sessions
      const sessionsInsert = events.map((ev) => ({
        calendar_event_id: ev.id,
        coach_id: userId ?? null,
        topic: input.topic ?? null,
        group_tag: input.group_tag ?? null,
        batch_id: batchId,
      }));
      const { data: sessions, error: tsErr } = await supabase
        .from('training_sessions')
        .insert(sessionsInsert)
        .select();
      if (tsErr) throw tsErr;

      // 3. 把 source_id 補上（成對更新）
      await Promise.all(
        sessions.map((s, i) =>
          supabase.from('calendar_events').update({ source_id: s.id }).eq('id', events[i]!.id),
        ),
      );

      return sessions as TrainingSessionRow[];
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (training: TrainingWithEvent) => {
      // 設定 RLS 後 cascade 由 calendar_events on delete cascade 把 training 也帶走
      if (training.event) {
        const { error } = await supabase.from('calendar_events').delete().eq('id', training.event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('training_sessions').delete().eq('id', training.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

/** 刪掉整批週期性訓練 */
export function useDeleteTrainingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data: sessions, error: qErr } = await supabase
        .from('training_sessions')
        .select('calendar_event_id')
        .eq('batch_id', batchId);
      if (qErr) throw qErr;
      const eventIds = (sessions ?? []).map((s) => s.calendar_event_id);
      if (eventIds.length === 0) return;
      const { error } = await supabase.from('calendar_events').delete().in('id', eventIds);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

/* ---------- Attendance ---------- */

export function useAttendance(trainingId: string | undefined) {
  return useQuery({
    queryKey: QK.training.attendance(trainingId ?? '__none__'),
    enabled: Boolean(trainingId),
    queryFn: async (): Promise<AttendanceRow[]> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('training_id', trainingId!);
      if (error) throw error;
      return (data ?? []) as AttendanceRow[];
    },
  });
}

export function useUpsertAttendance() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Array<{ training_id: string; player_id: string; status: AttendanceStatus }>) => {
      const payload = rows.map((r) => ({
        ...r,
        recorded_by: userId ?? null,
        recorded_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'training_id,player_id' });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      const trainingId = vars[0]?.training_id;
      if (trainingId) {
        void qc.invalidateQueries({ queryKey: QK.training.attendance(trainingId) });
      }
    },
  });
}

/** 取得未來 14 天訓練（給請假表單以外的場景用） */
export function useUpcomingTrainings(days = 14) {
  return useTrainings(new Date(), addDays(new Date(), days));
}

/** 球員：取得今日訓練（開始於今天 00:00 ~ 23:59）含自己的出席紀錄 */
export function useMyAttendanceToday() {
  const userId = useAuthStore((s) => s.profile?.id);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: ['training', 'today-checkin', userId, todayStart.toDateString()],
    enabled: Boolean(userId),
    queryFn: async () => {
      // 今日訓練
      const { data: sessions, error: sErr } = await supabase
        .from('training_sessions')
        .select('*, event:calendar_events!training_sessions_calendar_event_id_fkey(*)')
        .gte('event.starts_at', todayStart.toISOString())
        .lte('event.starts_at', todayEnd.toISOString())
        .order('event(starts_at)', { ascending: true });
      if (sErr) throw sErr;

      const todayTrainings = (sessions ?? []) as unknown as TrainingWithEvent[];
      if (todayTrainings.length === 0) return [];

      // 自己今日的出席紀錄
      const ids = todayTrainings.map((t) => t.id);
      const { data: records, error: rErr } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('player_id', userId!)
        .in('training_id', ids);
      if (rErr) throw rErr;

      const recordMap = new Map<string, AttendanceRow>(
        (records ?? []).map((r) => [r.training_id, r as AttendanceRow]),
      );

      return todayTrainings.map((t) => ({
        training: t,
        myRecord: recordMap.get(t.id) ?? null,
      }));
    },
  });
}

/** 球員：自助打卡（只能標 present / late） */
export function useSelfCheckIn() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trainingId,
      status,
    }: {
      trainingId: string;
      status: 'present' | 'late';
    }) => {
      if (!userId) throw new Error('not authenticated');
      const { error } = await supabase.from('attendance_records').upsert(
        {
          training_id: trainingId,
          player_id: userId,
          status,
          recorded_by: userId,
          recorded_at: new Date().toISOString(),
        },
        { onConflict: 'training_id,player_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training', 'today-checkin'] });
      void qc.invalidateQueries({ queryKey: QK.training.list('', '') });
    },
  });
}
