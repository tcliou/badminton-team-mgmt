import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Pin } from 'lucide-react';
import { MarkdownPreview } from './MarkdownPreview';
import { formatDateTime } from '@/shared/utils/dates';
import { cn } from '@/shared/utils/cn';
import type { AnnouncementRow } from '@/core/supabase/types';

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

  return (
    <li className={cn('rounded-lg border bg-card', row.is_pinned && 'border-primary/40')}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
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
        </div>
      ) : null}
    </li>
  );
}
