import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { QK } from '@/shared/utils/queryKeys';
import type { PlayerParentRow, ProfileRow } from '@/core/supabase/types';

/* ---------- 家長列表 ---------- */

export function useActiveParents() {
  return useQuery({
    queryKey: [...QK.profile.list, 'parent'],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(
            roles!inner(name)
          )
        `)
        .eq('status', 'active')
        .eq('user_roles.roles.name', 'parent')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });
}

/* ---------- 家長綁定的球員 ---------- */

/** 回傳 parent_id 所綁定的所有球員 (含 relationship 備註) */
export type LinkedPlayerRow = PlayerParentRow & { player: ProfileRow };

export function useLinkedPlayers(parentId: string | undefined) {
  return useQuery({
    queryKey: ['player_parents', 'by_parent', parentId],
    enabled: Boolean(parentId),
    queryFn: async (): Promise<LinkedPlayerRow[]> => {
      const { data, error } = await supabase
        .from('player_parents')
        .select(`
          *,
          player:profiles!player_parents_player_id_fkey(*)
        `)
        .eq('parent_id', parentId!);
      if (error) throw error;
      return (data ?? []) as LinkedPlayerRow[];
    },
  });
}

/** 取得 player_id 所綁定的所有家長 (供 Player 詳細頁使用) */
export type LinkedParentRow = PlayerParentRow & { parent: ProfileRow };

export function useLinkedParents(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_parents', 'by_player', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<LinkedParentRow[]> => {
      const { data, error } = await supabase
        .from('player_parents')
        .select(`
          *,
          parent:profiles!player_parents_parent_id_fkey(*)
        `)
        .eq('player_id', playerId!);
      if (error) throw error;
      return (data ?? []) as LinkedParentRow[];
    },
  });
}

/** 新增家長 ↔ 球員綁定 */
export function useLinkPlayer(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playerId,
      relationship,
    }: {
      playerId: string;
      relationship?: string;
    }) => {
      const { error } = await supabase.from('player_parents').insert({
        parent_id: parentId,
        player_id: playerId,
        relationship: relationship ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['player_parents', 'by_parent', parentId] });
    },
  });
}

/** 解除家長 ↔ 球員綁定 (by player_parents.id) */
export function useUnlinkPlayer(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from('player_parents').delete().eq('id', rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['player_parents', 'by_parent', parentId] });
    },
  });
}
