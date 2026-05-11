import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import type { PaymentRecordRow } from '@/core/supabase/types';

const QK = {
  pending: ['finance', 'pendingRecords'] as const,
};

export type PendingRecord = PaymentRecordRow & {
  player: { display_name: string; username: string } | null;
  item: { name: string; amount: number } | null;
};

/** finance 端：列出所有 pending 的繳費紀錄，含球員與費用資料 */
export function usePendingPayments() {
  return useQuery({
    queryKey: QK.pending,
    queryFn: async (): Promise<PendingRecord[]> => {
      const { data, error } = await supabase
        .from('payment_records')
        .select(
          '*, player:profiles!payment_records_player_id_fkey(display_name,username), item:payment_items(name,amount)',
        )
        .eq('status', 'pending')
        .order('paid_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PendingRecord[];
    },
  });
}

/** 對 payment-proofs bucket 的私有檔案產生 60 秒 signed URL */
export function useProofSignedUrl() {
  return useMutation({
    mutationFn: async (path: string): Promise<string> => {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

/** 確認收款：呼叫 RPC，原子化更新 record + 寫入 transactions */
export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await supabase.rpc('confirm_payment', {
        p_record_id: id,
        p_note: note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/** 退回繳費：呼叫 RPC */
export function useRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.rpc('reject_payment', {
        p_record_id: id,
        p_note: note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
