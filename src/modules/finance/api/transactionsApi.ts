import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, endOfMonth, startOfMonth, startOfYear } from 'date-fns';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import type {
  FinanceDirection,
  FinanceTransactionRow,
} from '@/core/supabase/types';

const QK = {
  month: (yyyymm: string) => ['finance', 'transactions', 'month', yyyymm] as const,
  range: (from: string, to: string) => ['finance', 'transactions', 'range', from, to] as const,
  ytd: (year: number) => ['finance', 'transactions', 'ytd', year] as const,
  activeProfiles: ['finance', 'activeProfiles'] as const,
};

const ymKey = (d: Date) => format(d, 'yyyy-MM');

export function useMonthTransactions(month: Date) {
  const ym = ymKey(month);
  return useQuery({
    queryKey: QK.month(ym),
    queryFn: async (): Promise<FinanceTransactionRow[]> => {
      const from = format(startOfMonth(month), 'yyyy-MM-dd');
      const to = format(endOfMonth(month), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinanceTransactionRow[];
    },
  });
}

export function useRangeTransactions(start: Date, end: Date) {
  const fromStr = format(start, 'yyyy-MM-dd');
  const toStr = format(end, 'yyyy-MM-dd');
  return useQuery({
    queryKey: QK.range(fromStr, toStr),
    queryFn: async (): Promise<FinanceTransactionRow[]> => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('occurred_on', fromStr)
        .lte('occurred_on', toStr)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinanceTransactionRow[];
    },
  });
}

export function useYearToDateSummary(month: Date) {
  const year = month.getFullYear();
  return useQuery({
    queryKey: QK.ytd(year),
    queryFn: async (): Promise<{ income: number; expense: number }> => {
      const from = format(startOfYear(month), 'yyyy-MM-dd');
      const to = format(endOfMonth(month), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('direction,amount')
        .gte('occurred_on', from)
        .lte('occurred_on', to);
      if (error) throw error;
      let income = 0;
      let expense = 0;
      (data ?? []).forEach((r) => {
        if (r.direction === 'income') income += Number(r.amount);
        else expense += Number(r.amount);
      });
      return { income, expense };
    },
  });
}

export function useActiveProfiles() {
  return useQuery({
    queryKey: QK.activeProfiles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .eq('status', 'active')
        .order('display_name');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export interface TransactionInput {
  direction: FinanceDirection;
  occurred_on: string;
  category?: string | null;
  item: string;
  amount: number;
  counterparty?: string | null;
  advanced_by_user_id?: string | null;
  note?: string | null;
}

export function useCreateTransaction() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .insert({ ...input, created_by: userId ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as FinanceTransactionRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<TransactionInput>) => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as FinanceTransactionRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
  });
}
