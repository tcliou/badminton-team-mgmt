import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { useDeleteLeave, useMyLeaves } from '../api/leavesApi';
import { StatusBadge } from './StatusBadge';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDateTime } from '@/shared/utils/dates';

export function MyLeavesList() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyLeaves();
  const del = useDeleteLeave();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('leaves:history.noRecord')} />;

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('leaves:history.deleteConfirm'))) return;
    await del.mutateAsync(id);
  };

  return (
    <ul className="space-y-2">
      {data.map((lv) => (
        <li key={lv.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lv.status} />
                <span className="text-xs text-muted-foreground">
                  {t(`leaves:reason.${lv.reason_type}`)}
                </span>
              </div>
              <p className="text-sm">
                {formatDateTime(lv.start_at)} — {formatDateTime(lv.end_at)}
              </p>
              {lv.reason_text ? (
                <p className="text-xs text-muted-foreground">{lv.reason_text}</p>
              ) : null}
              {lv.status === 'rejected' && lv.review_note ? (
                <p className="text-xs text-rose-600">↪ {lv.review_note}</p>
              ) : null}
            </div>
            {lv.status === 'pending' ? (
              <button
                type="button"
                onClick={() => void handleDelete(lv.id)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs hover:bg-accent"
                aria-label={t('leaves:history.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t('leaves:history.delete')}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
