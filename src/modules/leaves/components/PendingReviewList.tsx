import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { useReviewLeave, usePendingLeaves } from '../api/leavesApi';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDateTime } from '@/shared/utils/dates';

export function PendingReviewList() {
  const { t } = useTranslation();
  const { data, isLoading } = usePendingLeaves();
  const review = useReviewLeave();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <EmptyState title={t('leaves:review.noPending')} />;

  const approve = async (id: string) => {
    await review.mutateAsync({ id, status: 'approved' });
  };
  const reject = async (id: string) => {
    if (!note.trim()) return;
    await review.mutateAsync({ id, status: 'rejected', review_note: note.trim() });
    setRejecting(null);
    setNote('');
  };

  return (
    <ul className="space-y-2">
      {data.map((lv) => (
        <li key={lv.id} className="rounded-lg border bg-card p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {lv.player?.display_name ?? '?'}{' '}
              <span className="text-xs text-muted-foreground">@{lv.player?.username ?? '?'}</span>
            </p>
            <p className="text-sm">
              {formatDateTime(lv.start_at)} — {formatDateTime(lv.end_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`leaves:reason.${lv.reason_type}`)}
              {lv.reason_text ? `｜${lv.reason_text}` : ''}
            </p>
          </div>

          {rejecting === lv.id ? (
            <div className="mt-3 space-y-2">
              <label className="text-xs font-medium">{t('leaves:review.noteLabel')}</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void reject(lv.id)}
                  disabled={!note.trim() || review.isPending}
                >
                  {t('leaves:review.reject')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejecting(null);
                    setNote('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => void approve(lv.id)}
                disabled={review.isPending}
                className="gap-1"
              >
                <Check className="h-4 w-4" aria-hidden />
                {t('leaves:review.approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejecting(lv.id)}
                disabled={review.isPending}
                className="gap-1"
              >
                <X className="h-4 w-4" aria-hidden />
                {t('leaves:review.reject')}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
