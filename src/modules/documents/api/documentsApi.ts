import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import type { DocumentRow } from '@/core/supabase/types';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocumentRow[];
    },
  });
}

export function useMutateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<DocumentRow> & { id?: string }) => {
      if (payload.id) {
        const { data, error } = await supabase
          .from('documents')
          .update(payload)
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return data as DocumentRow;
      } else {
        const insertPayload = { ...payload };
        delete insertPayload.id;
        const { data, error } = await supabase
          .from('documents')
          .insert(insertPayload as unknown as Pick<DocumentRow, 'title' | 'url'> & Partial<DocumentRow>)
          .select()
          .single();
        if (error) throw error;
        return data as DocumentRow;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
