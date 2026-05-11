import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { isItemForPlayer } from '@/shared/utils/paymentTargeting';
import type { PaymentItemRow, PaymentRecordRow } from '@/core/supabase/types';

export type PlayerPaymentEntry = {
  item: PaymentItemRow;
  record?: PaymentRecordRow;
};

/**
 * 取得指定球員的「應繳費用 + 最新繳費紀錄」聚合。
 * 跟 payments/api/myPaymentsApi 的 useMyPayments 邏輯相同，
 * 差別只在這邊吃任意 playerId（給球員詳情頁顯示其他人的狀況）。
 */
export function usePlayerPayments(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player', 'payments', playerId ?? '__none__'],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PlayerPaymentEntry[]> => {
      if (!playerId) return [];
      const [{ data: items, error: e1 }, { data: records, error: e2 }, { data: roles, error: e3 }] =
        await Promise.all([
          supabase
            .from('payment_items')
            .select('*')
            .eq('status', 'active'),
          supabase
            .from('payment_records')
            .select('*')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false }),
          supabase.from('user_roles').select('role_id').eq('user_id', playerId),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;

      const recordsByItem = new Map<string, PaymentRecordRow>();
      ((records ?? []) as PaymentRecordRow[]).forEach((r) => {
        if (!recordsByItem.has(r.item_id)) recordsByItem.set(r.item_id, r);
      });

      const roleIds = (roles ?? []).map((r) => r.role_id);

      return ((items ?? []) as PaymentItemRow[])
        .filter((it) => isItemForPlayer(it, playerId, roleIds))
        .sort((a, b) => {
          // 排序：未繳/退回優先，再按 due_date
          const ra = recordsByItem.get(a.id);
          const rb = recordsByItem.get(b.id);
          const wa = !ra || ra.status === 'rejected' ? 0 : ra.status === 'pending' ? 1 : 2;
          const wb = !rb || rb.status === 'rejected' ? 0 : rb.status === 'pending' ? 1 : 2;
          if (wa !== wb) return wa - wb;
          return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999');
        })
        .map((item) => ({ item, record: recordsByItem.get(item.id) }));
    },
  });
}
