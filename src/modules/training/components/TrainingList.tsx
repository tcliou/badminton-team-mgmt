import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ClipboardList, MapPin, Trash2 } from 'lucide-react';
import {
  useDeleteTraining,
  useDeleteTrainingBatch,
  useTrainings,
  type TrainingWithEvent,
} from '../api/trainingApi';
import { AttendancePanel } from './AttendancePanel';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { formatDateTime } from '@/shared/utils/dates';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';

interface Props {
  fromDate: Date;
  toDate: Date;
  emptyKey: 'noUpcoming' | 'noPast';
}

export function TrainingList({ fromDate, toDate, emptyKey }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useTrainings(fromDate, toDate);
  const del = useDeleteTraining();
  const delBatch = useDeleteTrainingBatch();
  const canManage = useCan(PERMISSIONS.ActionTrainingManage);
  const canRoll = useCan(PERMISSIONS.ActionTrainingAttendance);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t(`training:list.${emptyKey}`)} />;

  const handleDelete = async (tr: TrainingWithEvent) => {
    const sameBatch = tr.batch_id ? data.filter((x) => x.batch_id === tr.batch_id) : [];
    if (tr.batch_id && sameBatch.length > 1) {
      const ok = window.confirm(
        t('training:list.deleteBatchConfirm', { count: sameBatch.length }),
      );
      if (!ok) return;
      await delBatch.mutateAsync(tr.batch_id);
      return;
    }
    if (!window.confirm(t('training:list.deleteConfirm'))) return;
    await del.mutateAsync(tr);
  };

  return (
    <ul className="space-y-2">
      {data.map((tr) => (
        <li key={tr.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{tr.event?.title ?? '?'}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {formatDateTime(tr.event?.starts_at)} – {formatDateTime(tr.event?.ends_at, 'HH:mm')}
                </span>
                {tr.event?.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {tr.event.location}
                  </span>
                ) : null}
                {tr.topic ? <span>· {tr.topic}</span> : null}
                {tr.group_tag ? <span>· {tr.group_tag}</span> : null}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              {canRoll ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenId(openId === tr.id ? null : tr.id)}
                  className="gap-1"
                >
                  <ClipboardList className="h-4 w-4" aria-hidden />
                  {t('training:list.openAttendance')}
                </Button>
              ) : null}
              {canManage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleDelete(tr)}
                  aria-label={t('training:list.delete')}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
              ) : null}
            </div>
          </div>
          {openId === tr.id ? (
            <div className="mt-3">
              <AttendancePanel training={tr} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
