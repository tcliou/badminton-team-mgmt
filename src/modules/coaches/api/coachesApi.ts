import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import type { CoachProfile } from '@/core/supabase/types';

export function useCoaches() {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CoachProfile[];
    },
  });
}

export function useMutateCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<CoachProfile> & { id?: string; name?: string }) => {
      if (payload.id) {
        const { data, error } = await supabase
          .from('coaches')
          .update(payload)
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return data as CoachProfile;
      } else {
        const insertPayload = payload as Pick<CoachProfile, 'name'> & Partial<CoachProfile>;
        const { data, error } = await supabase
          .from('coaches')
          .insert(insertPayload)
          .select()
          .single();
        if (error) throw error;
        return data as CoachProfile;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}
