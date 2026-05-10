import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { QK } from '@/shared/utils/queryKeys';
import type {
  PlayerExperienceRow,
  PlayerMatchRow,
  ProfileRow,
} from '@/core/supabase/types';

/* ---------- 列表 / 詳情 ---------- */

export function useActivePlayers() {
  return useQuery({
    queryKey: QK.profile.list,
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: QK.profile.detail(id ?? '__none__'),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
  });
}

export function useUpdateProfile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.profile.detail(id) });
      void qc.invalidateQueries({ queryKey: QK.profile.list });
      void qc.invalidateQueries({ queryKey: QK.profile.me });
    },
  });
}

/* ---------- 比賽成績 ---------- */

export function usePlayerMatches(playerId: string | undefined) {
  return useQuery({
    queryKey: QK.player.matches(playerId ?? '__none__'),
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PlayerMatchRow[]> => {
      const { data, error } = await supabase
        .from('player_match_records')
        .select('*')
        .eq('player_id', playerId!)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlayerMatchRow[];
    },
  });
}

export function useCreateMatch(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<PlayerMatchRow, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'player_id'>) => {
      const { data, error } = await supabase
        .from('player_match_records')
        .insert({ ...input, player_id: playerId })
        .select()
        .single();
      if (error) throw error;
      return data as PlayerMatchRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.player.matches(playerId) }),
  });
}

export function useDeleteMatch(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('player_match_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.player.matches(playerId) }),
  });
}

/* ---------- 經歷 ---------- */

export function usePlayerExperiences(playerId: string | undefined) {
  return useQuery({
    queryKey: QK.player.experiences(playerId ?? '__none__'),
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PlayerExperienceRow[]> => {
      const { data, error } = await supabase
        .from('player_experiences')
        .select('*')
        .eq('player_id', playerId!)
        .order('start_ym', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlayerExperienceRow[];
    },
  });
}

export function useCreateExperience(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<PlayerExperienceRow, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'player_id'>) => {
      const { data, error } = await supabase
        .from('player_experiences')
        .insert({ ...input, player_id: playerId })
        .select()
        .single();
      if (error) throw error;
      return data as PlayerExperienceRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.player.experiences(playerId) }),
  });
}

export function useDeleteExperience(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('player_experiences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.player.experiences(playerId) }),
  });
}

/* ---------- 球員的請假（顯示用，唯讀） ---------- */

export function usePlayerRecentLeaves(playerId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: QK.leaves.forPlayer(playerId ?? '__none__'),
    enabled: Boolean(playerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('player_id', playerId!)
        .order('start_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
