import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import {
  fromDateTimeInputValue,
  toDateTimeInputValue,
} from '@/shared/utils/dates';
import {
  useRegisterPayment,
  useUpdateMyPayment,
  useUploadProof,
  useWithdrawMyPayment,
} from '../api/myPaymentsApi';
import type {
  PaymentChannel,
  PaymentItemRow,
  PaymentRecordRow,
} from '@/core/supabase/types';

const CHANNELS: PaymentChannel[] = ['bank', 'cash', 'linepay', 'other'];

const schema = z.object({
  channel: z.enum(['bank', 'cash', 'linepay', 'other']),
  amount: z.coerce.number().positive(),
  paid_at: z.string().min(1),
  transfer_last5: z.string().max(5).optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  item: PaymentItemRow;
  /** 既有的 pending/rejected 紀錄，傳入代表編輯模式 */
  editing?: PaymentRecordRow | null;
  /** 家長代替小孩繳費時，傳入小孩的 player_id */
  forPlayerId?: string;
  /** 顯示用的小孩名字（配合 forPlayerId 提示用戶目前操作對象） */
  forPlayerName?: string;
}

export function PaymentRegisterDialog({ open, onClose, item, editing, forPlayerId, forPlayerName }: Props) {
  const { t } = useTranslation();
  const register_ = useRegisterPayment();
  const update = useUpdateMyPayment();
  const withdraw = useWithdrawMyPayment();
  const upload = useUploadProof();
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      channel: editing?.channel ?? 'bank',
      amount: editing ? Number(editing.amount) : Number(item.amount),
      paid_at: toDateTimeInputValue(editing?.paid_at ?? new Date()),
      transfer_last5: editing?.transfer_last5 ?? '',
    });
    setProofPath(editing?.proof_url ?? null);
    setProofFileName(editing?.proof_url ? '(existing)' : null);
  }, [open, editing, item.amount, reset]);

  if (!open) return null;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setProofFileName(file.name);
    const path = await upload.mutateAsync(file);
    setProofPath(path);
  };

  const onSubmit = async (d: FormOutput) => {
    const payload = {
      channel: d.channel,
      amount: d.amount,
      paid_at: fromDateTimeInputValue(d.paid_at),
      transfer_last5: d.transfer_last5 || null,
      proof_url: proofPath,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await register_.mutateAsync({ item_id: item.id, forPlayerId, ...payload });
    }
    onClose();
  };

  const handleWithdraw = async () => {
    if (!editing) return;
    if (!window.confirm(t('payments:form.withdrawConfirm'))) return;
    await withdraw.mutateAsync(editing.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-3 rounded-xl border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h3 className="text-base font-semibold">{t('payments:form.title')}</h3>
          <p className="text-xs text-muted-foreground">{item.name}</p>
          {forPlayerName ? (
            <p className="mt-0.5 text-xs font-medium text-primary">
              {t('payments:parent.selectChild')}：{forPlayerName}
            </p>
          ) : null}
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('payments:form.channel')}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('channel')}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t(`payments:channel.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('payments:form.amount')}</label>
            <Input type="number" step="1" {...register('amount')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">{t('payments:form.paidAt')}</label>
            <Input type="datetime-local" {...register('paid_at')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">
              {t('payments:form.transferLast5')}
            </label>
            <Input maxLength={5} {...register('transfer_last5')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">{t('payments:form.proof')}</label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            {upload.isPending ? (
              <p className="text-xs text-muted-foreground">{t('payments:form.uploading')}</p>
            ) : proofFileName ? (
              <p className="text-xs text-emerald-700">✓ {proofFileName}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {editing && editing.status === 'pending' ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleWithdraw()}
                className="gap-1 text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('payments:form.withdraw')}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('payments:form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || upload.isPending}>
              {isSubmitting ? t('common.loading') : t('payments:form.submit')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
