import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';

export const SETTINGS_QUERY_KEY = ['team_settings'];

/**
 * 取得球隊的全域設定
 */
export function useTeamSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_settings')
        .select('*')
        .eq('team_id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data ?? null;
    },
  });
}

/**
 * 更新球隊全域設定
 */
export function useUpdateTeamSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { nav_order?: string[]; nav_hidden?: string[] }) => {
      const { data, error } = await supabase
        .from('team_settings')
        .update(payload)
        .eq('team_id', '00000000-0000-0000-0000-000000000001')
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
}
