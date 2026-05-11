import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';
import { eventBus } from '@/shared/utils/eventBus';
import type { AnnouncementRow, AnnouncementStatus } from '@/core/supabase/types';

const QK = {
  all: ['announcements', 'all'] as const,
  byStatus: (status: AnnouncementStatus | 'all') =>
    ['announcements', 'byStatus', status] as const,
  homeFeed: ['announcements', 'home'] as const,
};

/** 公告管理頁列表（管理者用，看得到草稿與排程） */
export function useAllAnnouncements(filter: AnnouncementStatus | 'all' = 'all') {
  return useQuery({
    queryKey: QK.byStatus(filter),
    queryFn: async (): Promise<AnnouncementRow[]> => {
      let q = supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('publish_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnnouncementRow[];
    },
  });
}

/** 首頁顯示用：只取已發布的，置頂排前 */
export function useHomeAnnouncements() {
  return useQuery({
    queryKey: QK.homeFeed,
    queryFn: async (): Promise<AnnouncementRow[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('publish_at', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      // 後端 RLS 已經過濾過「對我可見」，但 published 也排除 publish_at > now
      const now = Date.now();
      return ((data ?? []) as AnnouncementRow[]).filter(
        (a) => !a.publish_at || new Date(a.publish_at).getTime() <= now,
      );
    },
  });
}

export interface AnnouncementInput {
  title: string;
  body_md: string;
  is_pinned: boolean;
  status: AnnouncementStatus;
  publish_at: string | null;
  visible_to_role_ids: string[];
}

export function useCreateAnnouncement() {
  const userId = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ ...input, author_id: userId ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as AnnouncementRow;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ['announcements'] });
      eventBus.emit('announcements:published', { announcementId: row.id });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<AnnouncementInput>) => {
      const { data, error } = await supabase
        .from('announcements')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AnnouncementRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
