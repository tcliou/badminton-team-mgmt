import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink, X } from 'lucide-react';
import {
  useConfirmPayment,
  usePendingPayments,
  useProofSignedUrl,
  useRejectPayment,
} from '../api/paymentRecordsApi';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { formatDateTime } from '@/shared/utils/dates';
import { formatCurrency } from '@/shared/utils/currency';

export function ReconcileList() {
  const { t } = useTranslation();
  const { data, isLoading } = usePendingPayments();
  const confirm = useConfirmPayment();
  const reject = useRejectPayment();
  const signProof = useProofSignedUrl();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [confirmingNote, setConfirmingNote] = useState<Record<string, string>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const handleConfirm = async (id: string) => {
    await confirm.mutateAsync({ id, note: confirmingNote[id] || undefined });
  };
  const handleReject = async (id: string) => {
    const note = rejectNote[id] ?? '';
    if (!note.trim()) return;
    await reject.mutateAsync({ id, note: note.trim() });
    setRejecting(null);
  };
  const handleViewProof = async (path: string) => {
    const url = await signProof.mutateAsync(path);
    window.open(url, '_blank', 'noopener');
  };

  if (isLoading) return <Loading />;
  if (!data || data.length === 0)
    return <EmptyState title={t('finance:reconcile.empty')} />;

  return (
    <ul className="space-y-2">
      {data.map((rec) => (
        <li key={rec.id} className="rounded-lg border bg-card p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                {rec.item?.name ?? '?'}{' '}
                <span className="text-primary">{formatCurrency(rec.amount)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t('finance:reconcile.by', { name: rec.player?.display_name ?? '?' })}
                {' · '}
                {t(`finance:reconcile.channel.${rec.channel}`)}
                {' · '}
                {formatDateTime(rec.paid_at)}
              </p>
              {rec.transfer_last5 ? (
                <p className="text-xs text-muted-foreground">
                  {t('finance:reconcile.transferLast5', { value: rec.transfer_last5 })}
                </p>
              ) : null}
              {rec.proof_url ? (
                <button
                  type="button"
                  onClick={() => void handleViewProof(rec.proof_url!)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  {t('finance:reconcile.viewProof')}
                </button>
              ) : null}
            </div>
          </div>

          {rejecting === rec.id ? (
            <div className="mt-3 space-y-2">
              <label className="text-xs font-medium">
                {t('finance:reconcile.rejectReasonLabel')}
              </label>
              <Input
                value={rejectNote[rec.id] ?? ''}
                onChange={(e) =>
                  setRejectNote((m) => ({ ...m, [rec.id]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!rejectNote[rec.id]?.trim() || reject.isPending}
                  onClick={() => void handleReject(rec.id)}
                >
                  {t('finance:reconcile.submit')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejecting(null)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Input
                placeholder={t('finance:reconcile.noteOptional')}
                value={confirmingNote[rec.id] ?? ''}
                onChange={(e) =>
                  setConfirmingNote((m) => ({ ...m, [rec.id]: e.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleConfirm(rec.id)}
                  disabled={confirm.isPending}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {t('finance:reconcile.confirm')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejecting(rec.id)}
                  className="gap-1"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {t('finance:reconcile.reject')}
                </Button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
