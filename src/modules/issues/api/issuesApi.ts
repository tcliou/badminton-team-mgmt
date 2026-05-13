import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import type { IssueStatus, IssuePriority, IssueType, IssueLinkRow } from '@/core/supabase/types';

export const ISSUES_QUERY_KEY = ['issues'];

export function useIssues() {
  return useQuery({
    queryKey: ISSUES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          assignee:profiles!issues_assigned_to_fkey(id, display_name, avatar_url),
          creator:profiles!issues_created_by_fkey(id, display_name, avatar_url),
          parent:parent_id(id, title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export type IssueInput = {
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigned_to?: string | null;
  issue_type: IssueType;
  parent_id?: string | null;
  tags?: string[];
};

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: IssueInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not logged in');

      const { data, error } = await supabase
        .from('issues')
        .insert({
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigned_to: input.assigned_to,
          issue_type: input.issue_type,
          parent_id: input.parent_id,
          tags: input.tags || [],
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ISSUES_QUERY_KEY });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: IssueInput & { id: string }) => {
      const { data, error } = await supabase
        .from('issues')
        .update({
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigned_to: input.assigned_to,
          issue_type: input.issue_type,
          parent_id: input.parent_id,
          tags: input.tags || [],
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ISSUES_QUERY_KEY });
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('issues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ISSUES_QUERY_KEY });
    },
  });
}

export function useIssueLinks() {
  return useQuery({
    queryKey: ['issue_links'],
    queryFn: async () => {
      const { data, error } = await supabase.from('issue_links').select('*');
      if (error) throw error;
      return data as IssueLinkRow[];
    },
  });
}

export function useAddIssueLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { source_id: string; target_id: string; link_type?: string }) => {
      const { error } = await supabase.from('issue_links').insert({
        source_id: input.source_id,
        target_id: input.target_id,
        link_type: input.link_type || 'blocks',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issue_links'] });
    },
  });
}

export function useRemoveIssueLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('issue_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issue_links'] });
    },
  });
}
