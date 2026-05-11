import type { PaymentItemRow } from '@/core/supabase/types';

/**
 * 判斷某 payment_item 是否需要 charge 給某位球員。
 * 規則：
 *   - 若 target_role_ids 與 target_user_ids 兩者皆空 → 全員都要繳
 *   - 若 target_user_ids 包含此球員 → 要繳
 *   - 若 target_role_ids 與此球員的 roleIds 有交集 → 要繳
 *   - 否則不需要
 */
export function isItemForPlayer(
  item: Pick<PaymentItemRow, 'target_role_ids' | 'target_user_ids'>,
  playerId: string,
  playerRoleIds: string[],
): boolean {
  const noTarget =
    (item.target_role_ids?.length ?? 0) === 0 &&
    (item.target_user_ids?.length ?? 0) === 0;
  if (noTarget) return true;
  if (item.target_user_ids?.includes(playerId)) return true;
  if (item.target_role_ids?.some((r) => playerRoleIds.includes(r))) return true;
  return false;
}
