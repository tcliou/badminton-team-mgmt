import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import type { TrainingEnrollmentFormRow, TrainingEnrollmentRowRow, ProfileRow } from '@/core/supabase/types';

export const EK = {
  all: ['enrollments'] as const,
  forms: () => [...EK.all, 'forms'] as const,
  form: (id: string) => [...EK.forms(), id] as const,
  rows: (formId: string) => [...EK.form(formId), 'rows'] as const,
};

export type EnrollmentRowWithPlayer = TrainingEnrollmentRowRow & {
  player: Pick<ProfileRow, 'id' | 'student_id' | 'display_name' | 'username'>;
};

// --- Forms ---
export function useEnrollmentForms() {
  return useQuery({
    queryKey: EK.forms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_enrollment_forms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TrainingEnrollmentFormRow[];
    },
  });
}

export function useEnrollmentForm(id: string) {
  return useQuery({
    queryKey: EK.form(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_enrollment_forms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as TrainingEnrollmentFormRow;
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<TrainingEnrollmentFormRow, 'title' | 'dates' | 'status'>) => {
      const { data, error } = await supabase
        .from('training_enrollment_forms')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EK.forms() }),
  });
}

export function useUpdateForm(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<TrainingEnrollmentFormRow>) => {
      const { data, error } = await supabase
        .from('training_enrollment_forms')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EK.forms() });
      qc.invalidateQueries({ queryKey: EK.form(id) });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_enrollment_forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EK.forms() }),
  });
}

// --- Rows ---
export function useEnrollmentRows(formId: string) {
  return useQuery({
    queryKey: EK.rows(formId),
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_enrollment_rows')
        .select('*, player:profiles!training_enrollment_rows_player_id_fkey(id, student_id, display_name, username)')
        .eq('form_id', formId);
      if (error) throw error;
      return data as unknown as EnrollmentRowWithPlayer[];
    },
  });
}

export function useAddRow(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { data, error } = await supabase
        .from('training_enrollment_rows')
        .insert({ form_id: formId, player_id: playerId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EK.rows(formId) }),
  });
}

export function useUpdateRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TrainingEnrollmentRowRow> }) => {
      const { data, error } = await supabase
        .from('training_enrollment_rows')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all rows, as we don't have the formId here easily to invalidate just one.
      // Easiest is to invalidate all or figure out formId from somewhere
      qc.invalidateQueries({ queryKey: EK.all });
    },
  });
}

export function useDeleteRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_enrollment_rows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EK.all }),
  });
}
