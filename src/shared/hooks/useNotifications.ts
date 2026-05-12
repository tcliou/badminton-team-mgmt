import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';

export interface NotificationItem {
  id: string;
  label: string;
  /** 點擊通知導向的路徑 */
  path: string;
  count: number;
}

interface NotificationSummary {
  items: NotificationItem[];
  /** 總未讀數（紅點顯示用） */
  total: number;
}

const QK = {
  inbox: ['notifications', 'inbox'] as const,
};

/**
 * 登入後查詢一次通知摘要。
 * 根據使用者權限決定要查哪些資料：
 *  - 有 leaves:approve → 查待審核請假數
 *  - 有 finance:confirm → 查待對帳繳費數
 *  - 球員本人 → 查自己的 pending 請假（等待審核中）
 */
export function useNotifications(): NotificationSummary {
  const userId = useAuthStore((s) => s.profile?.id);
  const canApproveLeaves = useCan(PERMISSIONS.ActionLeavesApprove);
  const canConfirmFinance = useCan(PERMISSIONS.ActionFinanceConfirm);

  // 待審核請假（教練 / Admin 看到）
  const pendingLeavesQ = useQuery({
    queryKey: [...QK.inbox, 'pendingLeaves'],
    enabled: Boolean(userId) && canApproveLeaves,
    staleTime: 2 * 60 * 1000, // 2 分鐘 cache，避免每次 render 都打 API
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  // 待對帳繳費（Finance / Admin 看到）
  const pendingPaymentsQ = useQuery({
    queryKey: [...QK.inbox, 'pendingPayments'],
    enabled: Boolean(userId) && canConfirmFinance,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('payment_records')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  // 球員自己的 pending 請假（等待教練審核）
  const myPendingLeavesQ = useQuery({
    queryKey: [...QK.inbox, 'myPendingLeaves', userId],
    enabled: Boolean(userId) && !canApproveLeaves,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', userId!)
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const items: NotificationItem[] = [];

  const pendingLeaves = pendingLeavesQ.data ?? 0;
  if (canApproveLeaves && pendingLeaves > 0) {
    items.push({
      id: 'pending-leaves',
      label: `待審核請假 ${pendingLeaves} 筆`,
      path: PATHS.Leaves,
      count: pendingLeaves,
    });
  }

  const pendingPayments = pendingPaymentsQ.data ?? 0;
  if (canConfirmFinance && pendingPayments > 0) {
    items.push({
      id: 'pending-payments',
      label: `待對帳繳費 ${pendingPayments} 筆`,
      path: PATHS.Finance,
      count: pendingPayments,
    });
  }

  const myPendingLeaves = myPendingLeavesQ.data ?? 0;
  if (!canApproveLeaves && myPendingLeaves > 0) {
    items.push({
      id: 'my-pending-leaves',
      label: `我的請假審核中 ${myPendingLeaves} 筆`,
      path: PATHS.Leaves,
      count: myPendingLeaves,
    });
  }

  return {
    items,
    total: items.reduce((sum, n) => sum + n.count, 0),
  };
}

/** 讓外部元件可以 invalidate 通知 cache（例如審核完後刷新） */
export { QK as notificationsQK };
