import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { QK } from '@/shared/utils/queryKeys';
import type {
  CalendarEventRow,
  LeaveRequestRow,
  PersonalEventRow,
} from '@/core/supabase/types';

/* ---------- Team events ---------- */

export function useTeamEvents(rangeFrom: Date, rangeTo: Date) {
  return useQuery({
    queryKey: QK.calendar.teamRange(rangeFrom.toISOString(), rangeTo.toISOString()),
    queryFn: async (): Promise<CalendarEventRow[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('starts_at', rangeFrom.toISOString())
        .lte('starts_at', rangeTo.toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEventRow[];
    },
  });
}

/* ---------- Personal events ---------- */

export function usePersonalEvents(rangeFrom: Date, rangeTo: Date) {
  const ownerId = useAuthStore((s) => s.profile?.id);
  return useQuery({
    queryKey: QK.calendar.personalRange(
      ownerId ?? '__anon__',
      rangeFrom.toISOString(),
      rangeTo.toISOString(),
    ),
    enabled: Boolean(ownerId),
    queryFn: async (): Promise<PersonalEventRow[]> => {
      const { data, error } = await supabase
        .from('personal_events')
        .select('*')
        .eq('owner_id', ownerId!)
        .gte('starts_at', rangeFrom.toISOString())
        .lte('starts_at', rangeTo.toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersonalEventRow[];
    },
  });
}

export interface PersonalEventInput {
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  color?: string | null;
}

export function useCreatePersonalEvent() {
  const ownerId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonalEventInput) => {
      if (!ownerId) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from('personal_events')
        .insert({
          owner_id: ownerId,
          title: input.title,
          description: input.description ?? null,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          color: input.color ?? '#10b981',
        })
        .select()
        .single();
      if (error) throw error;
      return data as PersonalEventRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar', 'personal'] }),
  });
}

export function useUpdatePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<PersonalEventInput>) => {
      const { data, error } = await supabase
        .from('personal_events')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PersonalEventRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar', 'personal'] }),
  });
}

export function useDeletePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar', 'personal'] }),
  });
}

/* ---------- 已 approved 的請假（顯示在球隊行事曆） ---------- */

export function useApprovedLeavesInRange(rangeFrom: Date, rangeTo: Date) {
  return useQuery({
    queryKey: ['calendar', 'leaves', rangeFrom.toISOString(), rangeTo.toISOString()],
    queryFn: async (): Promise<LeaveRequestRow[]> => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .lte('start_at', rangeTo.toISOString())
        .gte('end_at', rangeFrom.toISOString());
      if (error) throw error;
      return (data ?? []) as LeaveRequestRow[];
    },
  });
}
