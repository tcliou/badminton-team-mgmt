import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { QK } from '@/shared/utils/queryKeys';
import { eventBus } from '@/shared/utils/eventBus';
import type {
  LeaveReasonType,
  LeaveRequestRow,
  LeaveStatus,
} from '@/core/supabase/types';

export interface CreateLeaveInput {
  start_at: string;
  end_at: string;
  reason_type: LeaveReasonType;
  reason_text?: string | null;
  affected_event_ids?: string[];
}

export interface ReviewLeaveInput {
  id: string;
  status: Exclude<LeaveStatus, 'pending'>;
  review_note?: string | null;
}

/** 取得「我的請假」 */
export function useMyLeaves() {
  const userId = useAuthStore((s) => s.profile?.id);
  return useQuery({
    queryKey: QK.leaves.mine,
    enabled: Boolean(userId),
    queryFn: async (): Promise<LeaveRequestRow[]> => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('player_id', userId!)
        .order('start_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaveRequestRow[];
    },
  });
}

/** 取得「待審核」清單（須具 leaves:approve 權限）
 *
 * 註：手寫 Database 沒宣告 Relationships，supabase 推不出 join 結果型別，
 * 用 `as unknown as` 強制定型；Phase 4 改用自動產生的 types 可拿掉。
 */
export function usePendingLeaves() {
  type Row = LeaveRequestRow & {
    player: { display_name: string; username: string } | null;
  };
  return useQuery({
    queryKey: QK.leaves.pending,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, player:profiles!leave_requests_player_id_fkey(display_name,username)')
        .eq('status', 'pending')
        .order('start_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
}

/** 球員開單 */
export function useCreateLeave() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveInput) => {
      if (!userId) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          player_id: userId,
          start_at: input.start_at,
          end_at: input.end_at,
          reason_type: input.reason_type,
          reason_text: input.reason_text ?? null,
          affected_event_ids: input.affected_event_ids ?? [],
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as LeaveRequestRow;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: QK.leaves.mine });
      void qc.invalidateQueries({ queryKey: QK.leaves.pending });
      // 跨模組廣播：行事曆顯示請假 ribbon 需要 refetch
      eventBus.emit('leaves:created', { leaveId: row.id });
    },
  });
}

/**
 * 家長代替小孩開單
 * 與 useCreateLeave 的差別：player_id 使用傳入的 childId，而非 auth.uid()。
 * 後端 RLS (0027_parent_rls) 允許 is_parent_of(player_id) 插入。
 */
export function useCreateLeaveForPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveInput & { player_id: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          player_id: input.player_id,
          start_at: input.start_at,
          end_at: input.end_at,
          reason_type: input.reason_type,
          reason_text: input.reason_text ?? null,
          affected_event_ids: input.affected_event_ids ?? [],
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as LeaveRequestRow;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: QK.leaves.pending });
      eventBus.emit('leaves:created', { leaveId: row.id });
    },
  });
}


/** 球員撤回（pending 才允許） */
export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leave_requests').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.leaves.mine });
    },
  });
}

/** 教練審核 */
export function useReviewLeave() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewLeaveInput) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: input.status,
          review_note: input.review_note ?? null,
          reviewed_by: userId ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as LeaveRequestRow;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: QK.leaves.mine });
      void qc.invalidateQueries({ queryKey: QK.leaves.pending });
      eventBus.emit('leaves:reviewed', { leaveId: row.id });
    },
  });
}
