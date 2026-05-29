import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Pin } from 'lucide-react';
import { MarkdownPreview } from './MarkdownPreview';
import { formatDateTime } from '@/shared/utils/dates';
import { cn } from '@/shared/utils/cn';
import type { AnnouncementRow } from '@/core/supabase/types';
import { useMarkAnnouncementAsRead, useAnnouncementReaders } from '../api/announcementsApi';
import { useAuthStore } from '@/core/store/authStore';
import * as Tooltip from '@radix-ui/react-tooltip';

/**
 * 列表中的一筆公告：預設只顯示標題 + 時間 + 置頂 badge，點開展開內文。
 * 用於首頁與公告管理頁。
 */
export function AnnouncementListItem({
  row,
  onClickEdit,
  defaultExpanded = false,
}: {
  row: AnnouncementRow;
  onClickEdit?: () => void;
  defaultExpanded?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultExpanded);
  const when = row.publish_at ?? row.created_at;
  
  const currentUser = useAuthStore(s => s.profile);
  const markAsRead = useMarkAnnouncementAsRead();
  const { data: readers = [] } = useAnnouncementReaders(row.id);

  const handleToggle = () => {
    setOpen((s) => {
      const next = !s;
      if (next && currentUser && !readers.some(r => r.user?.id === currentUser.id)) {
        markAsRead.mutate(row.id);
      }
      return next;
    });
  };

  return (
    <li className={cn('rounded-lg border bg-card', row.is_pinned && 'border-primary/40')}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {row.is_pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Pin className="h-3 w-3" aria-hidden />
                {t('announcements:list.pinned')}
              </span>
            ) : null}
            {row.status === 'draft' ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t('announcements:list.draft')}
              </span>
            ) : null}
            {row.status === 'scheduled' ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {t('announcements:list.scheduled', { when: formatDateTime(row.publish_at) })}
              </span>
            ) : null}
            <span>{row.title}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(when)}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>
      {open ? (
        <div className="border-t bg-background/50 px-3 pb-3 pt-2">
          {row.image_urls && row.image_urls.length > 0 && (
            <div className="mb-4 grid gap-2">
              {row.image_urls.map((url, i) => (
                <img key={i} src={url} alt={`Image ${i}`} className="w-full rounded-md object-cover" />
              ))}
            </div>
          )}
          {row.body_md ? (
            <MarkdownPreview body={row.body_md} />
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          {onClickEdit ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={onClickEdit}
                className="text-xs text-primary hover:underline"
              >
                {t('common.edit')}
              </button>
            </div>
          ) : null}

          {readers.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <span className="font-medium">已讀</span>
                <span>({readers.length})</span>
              </p>
              <Tooltip.Provider delayDuration={200}>
                <div className="flex flex-wrap gap-1">
                  {readers.map(reader => reader.user && (
                    <Tooltip.Root key={reader.user.id}>
                      <Tooltip.Trigger asChild>
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-background shadow-sm hover:z-10 relative">
                          {reader.user.avatar_url ? (
                            <img src={reader.user.avatar_url} alt={reader.user.display_name || ''} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-medium uppercase">
                              {(reader.user.display_name || '?').charAt(0)}
                            </span>
                          )}
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          className="z-50 rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-50 shadow-md"
                        >
                          {reader.user.display_name}
                          <Tooltip.Arrow className="fill-zinc-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ))}
                </div>
              </Tooltip.Provider>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
