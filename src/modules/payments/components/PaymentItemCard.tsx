import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FileText, Pencil } from 'lucide-react';
import { PaymentRegisterDialog } from './PaymentRegisterDialog';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { useMyProofSignedUrl, type MyPaymentItem } from '../api/myPaymentsApi';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';

interface Props {
  entry: MyPaymentItem;
}

export function PaymentItemCard({ entry }: Props) {
  const { t } = useTranslation();
  const { item, record } = entry;
  const [open, setOpen] = useState(false);
  const proofUrl = useMyProofSignedUrl();

  // unpaid: 沒有 record；rejected 視同可以重送（編輯既有 rejected 紀錄不允許，
  //   這裡讓使用者再開一筆新的 pending）
  const status = !record ? 'unpaid' : record.status;
  const canRegister = status === 'unpaid' || status === 'rejected';
  const editingTarget = record && record.status === 'pending' ? record : null;

  const handleViewProof = async () => {
    if (!record?.proof_url) return;
    const url = await proofUrl.mutateAsync(record.proof_url);
    window.open(url, '_blank', 'noopener');
  };

  return (
    <article
      className={cn(
        'space-y-2 rounded-xl border bg-card p-4',
        status === 'confirmed' && 'border-emerald-200 bg-emerald-50/30',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{item.name}</span>
            <span className="text-primary">{formatCurrency(item.amount)}</span>
            <PaymentStatusBadge status={status} />
          </p>
          <p className="text-xs text-muted-foreground">
            {item.due_date
              ? t('payments:card.due', { date: item.due_date })
              : t('payments:card.noDue')}
            {item.purpose ? ` · ${item.purpose}` : ''}
          </p>
        </div>
      </header>

      {item.description ? (
        <p className="rounded-md bg-muted/40 p-2 text-xs whitespace-pre-wrap text-muted-foreground">
          <FileText className="mr-1 inline h-3 w-3" aria-hidden />
          {item.description}
        </p>
      ) : null}

      {status === 'rejected' && record?.note ? (
        <p className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">
          {t('payments:rejectReason', { reason: record.note })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canRegister ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            {t('payments:card.register')}
          </Button>
        ) : null}
        {editingTarget ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t('payments:card.edit')}
          </Button>
        ) : null}
        {record?.proof_url ? (
          <button
            type="button"
            onClick={() => void handleViewProof()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {t('payments:card.viewProof')}
          </button>
        ) : null}
      </div>

      <PaymentRegisterDialog
        open={open}
        onClose={() => setOpen(false)}
        item={item}
        editing={editingTarget}
      />
    </article>
  );
}
