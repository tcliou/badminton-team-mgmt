import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { isItemForPlayer } from '@/shared/utils/paymentTargeting';
import type {
  PaymentChannel,
  PaymentItemRow,
  PaymentRecordRow,
} from '@/core/supabase/types';

const QK = {
  myItems: ['payments', 'myItems'] as const,
  myRecords: ['payments', 'myRecords'] as const,
};

/** 拿出登入者目前的 role IDs（從 v_my_profile 反查 user_roles）。
 *  v_my_profile 只給 role_names，這邊另外撈 ids。 */
async function fetchMyRoleIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role_id);
}

export type MyPaymentItem = {
  item: PaymentItemRow;
  /** 該球員針對此 item 的最新繳費紀錄（任何狀態），沒有就 undefined */
  record?: PaymentRecordRow;
};

export function useMyPayments() {
  const userId = useAuthStore((s) => s.profile?.id);
  return useQuery({
    queryKey: QK.myItems,
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyPaymentItem[]> => {
      if (!userId) return [];
      const [{ data: items, error: e1 }, { data: records, error: e2 }, roleIds] =
        await Promise.all([
          supabase
            .from('payment_items')
            .select('*')
            .eq('status', 'active')
            .order('due_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('payment_records')
            .select('*')
            .eq('player_id', userId)
            .order('created_at', { ascending: false }),
          fetchMyRoleIds(userId),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const recordsByItem = new Map<string, PaymentRecordRow>();
      ((records ?? []) as PaymentRecordRow[]).forEach((r) => {
        // 取每個 item_id 最新一筆
        if (!recordsByItem.has(r.item_id)) recordsByItem.set(r.item_id, r);
      });

      return ((items ?? []) as PaymentItemRow[])
        .filter((it) => isItemForPlayer(it, userId, roleIds))
        .map((item) => ({
          item,
          record: recordsByItem.get(item.id),
        }));
    },
  });
}

export interface RegisterPaymentInput {
  item_id: string;
  channel: PaymentChannel;
  amount: number;
  paid_at: string;
  transfer_last5?: string | null;
  proof_url?: string | null;
}

export function useRegisterPayment() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterPaymentInput) => {
      if (!userId) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          item_id: input.item_id,
          player_id: userId,
          channel: input.channel,
          amount: input.amount,
          paid_at: input.paid_at,
          transfer_last5: input.transfer_last5 ?? null,
          proof_url: input.proof_url ?? null,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as PaymentRecordRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useUpdateMyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<RegisterPaymentInput>) => {
      const { data, error } = await supabase
        .from('payment_records')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PaymentRecordRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useWithdrawMyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

/**
 * 家長視角：取得所有綁定小孩的繳費項目清單。
 * childIds: 從 useLinkedPlayers 拿到的 player_id 陣列。
 */
export type ChildPayments = {
  childId: string;
  childName: string;
  childUsername: string;
  items: MyPaymentItem[];
};

export function useChildrenPayments(
  children: Array<{ playerId: string; displayName: string; username: string; roleIds: string[] }>,
) {
  return useQuery({
    queryKey: ['payments', 'children', children.map((c) => c.playerId)],
    enabled: children.length > 0,
    queryFn: async (): Promise<ChildPayments[]> => {
      const childIds = children.map((c) => c.playerId);

      const [{ data: items, error: e1 }, { data: records, error: e2 }] = await Promise.all([
        supabase
          .from('payment_items')
          .select('*')
          .eq('status', 'active')
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('payment_records')
          .select('*')
          .in('player_id', childIds)
          .order('created_at', { ascending: false }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      // 建立 record index: item_id + player_id → most recent record
      const recordIndex = new Map<string, PaymentRecordRow>();
      ((records ?? []) as PaymentRecordRow[]).forEach((r) => {
        const key = `${r.item_id}::${r.player_id}`;
        if (!recordIndex.has(key)) recordIndex.set(key, r);
      });

      return children.map((child) => ({
        childId: child.playerId,
        childName: child.displayName,
        childUsername: child.username,
        items: ((items ?? []) as PaymentItemRow[])
          .filter((it) => isItemForPlayer(it, child.playerId, child.roleIds))
          .map((item) => ({
            item,
            record: recordIndex.get(`${item.id}::${child.playerId}`),
          })),
      }));
    },
  });
}


/** 上傳繳費證明到 Storage，回傳路徑（存進 payment_records.proof_url） */
export function useUploadProof() {
  const userId = useAuthStore((s) => s.profile?.id);
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!userId) throw new Error('not authenticated');
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return path;
    },
  });
}

/** 給球員自己看自己證明的 signed URL */
export function useMyProofSignedUrl() {
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

/** 我的繳費歷史（所有 records，含 item 名稱） */
export function useMyPaymentHistory() {
  const userId = useAuthStore((s) => s.profile?.id);
  return useQuery({
    queryKey: QK.myRecords,
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('payment_records')
        .select('*, item:payment_items(name)')
        .eq('player_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<
        PaymentRecordRow & { item: { name: string } | null }
      >;
    },
  });
}
