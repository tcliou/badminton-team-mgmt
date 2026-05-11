import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import type { PaymentItemRow, PaymentItemStatus } from '@/core/supabase/types';

const QK = {
  list: ['finance', 'items'] as const,
};

export function usePaymentItems() {
  return useQuery({
    queryKey: QK.list,
    queryFn: async (): Promise<PaymentItemRow[]> => {
      const { data, error } = await supabase
        .from('payment_items')
        .select('*')
        .order('status', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentItemRow[];
    },
  });
}

export interface PaymentItemInput {
  name: string;
  purpose?: string | null;
  description?: string | null;
  amount: number;
  due_date?: string | null;
  target_role_ids: string[];
  target_user_ids: string[];
  status: PaymentItemStatus;
}

export function useCreatePaymentItem() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentItemInput) => {
      const { data, error } = await supabase
        .from('payment_items')
        .insert({ ...input, created_by: userId ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as PaymentItemRow;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useUpdatePaymentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<PaymentItemInput>) => {
      const { data, error } = await supabase
        .from('payment_items')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PaymentItemRow;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useDeletePaymentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
