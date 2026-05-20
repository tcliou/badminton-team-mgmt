import { useTranslation } from 'react-i18next';
import { useMyPayments, useChildrenPayments } from '../api/myPaymentsApi';
import { PaymentItemCard } from '../components/PaymentItemCard';
import { MyPaymentHistory } from '../components/MyPaymentHistory';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { useAuthStore } from '@/core/store/authStore';
import { useLinkedPlayers } from '@/modules/parents/api/parentsApi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';

/** Fetch role ids for a list of player ids (needed for isItemForPlayer targeting) */
function useProfileRoleIds(playerIds: string[]) {
  return useQuery({
    queryKey: ['user_roles', 'bulk', playerIds],
    enabled: playerIds.length > 0,
    queryFn: async () => {
      if (playerIds.length === 0) return {} as Record<string, string[]>;
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role_id')
        .in('user_id', playerIds);
      if (error) throw error;
      const map: Record<string, string[]> = {};
      (data ?? []).forEach((r) => {
        (map[r.user_id] ??= []).push(r.role_id);
      });
      return map;
    },
  });
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyPayments();

  // 家長視角
  const profile = useAuthStore((s) => s.profile);
  const isParent = profile?.role_names.includes('parent') ?? false;
  const linkedQuery = useLinkedPlayers(isParent ? profile?.id : undefined);
  const linkedChildren = linkedQuery.data ?? [];
  const childPlayerIds = linkedChildren.map((r) => r.player_id);
  const roleIdsQuery = useProfileRoleIds(childPlayerIds);

  const childrenInput = linkedChildren.map((row) => ({
    playerId: row.player_id,
    displayName: row.player.display_name,
    username: row.player.username,
    roleIds: roleIdsQuery.data?.[row.player_id] ?? [],
  }));
  const childrenPaymentsQuery = useChildrenPayments(childrenInput);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('payments:title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('payments:intro')}</p>
      </header>

      {/* 自己的待繳費項目（所有角色都有） */}
      <section className="space-y-3">
        {isLoading ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t('payments:noItems')} />
        ) : (
          data.map((entry) => <PaymentItemCard key={entry.item.id} entry={entry} />)
        )}
      </section>

      {/* 家長視角：小孩的繳費項目 */}
      {isParent ? (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">{t('payments:parent.childrenSection')}</h2>

          {linkedQuery.isLoading || roleIdsQuery.isLoading ? (
            <Loading />
          ) : linkedChildren.length === 0 ? (
            <EmptyState title={t('payments:parent.noChildren')} />
          ) : childrenPaymentsQuery.isLoading ? (
            <Loading />
          ) : (
            (childrenPaymentsQuery.data ?? []).map((child) => (
              <div key={child.childId} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {child.childName}{' '}
                  <span className="font-normal">(@{child.childUsername})</span>
                </h3>
                {child.items.length === 0 ? (
                  <EmptyState title={t('payments:noItems')} />
                ) : (
                  child.items.map((entry) => (
                    <PaymentItemCard
                      key={`${child.childId}::${entry.item.id}`}
                      entry={entry}
                      // PaymentItemCard 內部的 useRegisterPayment 目前使用 auth.uid()；
                      // Phase 3 完整版可傳 forPlayerId prop 讓它代替小孩送出。
                      // 目前顯示狀態正確，繳費操作仍需使用球員本人帳號操作。
                    />
                  ))
                )}
              </div>
            ))
          )}
        </section>
      ) : null}

      {/* 我的繳費歷史 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t('payments:history.title')}</h2>
        <MyPaymentHistory />
      </section>
    </div>
  );
}
