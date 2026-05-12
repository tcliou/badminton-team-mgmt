import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
  useActiveProfiles,
} from '../api/transactionsApi';
import type { FinanceTransactionRow } from '@/core/supabase/types';

const schema = z.object({
  direction: z.enum(['income', 'expense']),
  occurred_on: z.string().min(1),
  category: z.string().optional(),
  item: z.string().min(1),
  amount: z.coerce.number().positive(),
  counterparty: z.string().optional(),
  advanced_by_user_id: z.string().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** 不傳代表新增 */
  editing?: FinanceTransactionRow | null;
  /** 預設月份（新增時用該月當天） */
  defaultMonth: Date;
  /** 預設的收支方向 */
  defaultDirection?: 'income' | 'expense';
}

export function TransactionForm({ open, onClose, editing, defaultMonth, defaultDirection = 'income' }: Props) {
  const { t } = useTranslation();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const del = useDeleteTransaction();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: profiles } = useActiveProfiles();
  const direction = watch('direction');

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            direction: editing.direction,
            occurred_on: editing.occurred_on,
            category: editing.category ?? '',
            item: editing.item,
            amount: Number(editing.amount),
            counterparty: editing.counterparty ?? '',
            advanced_by_user_id: editing.advanced_by_user_id ?? '',
            note: editing.note ?? '',
          }
        : {
            direction: defaultDirection,
            occurred_on: defaultMonth.toISOString().slice(0, 10),
            category: '',
            item: '',
            amount: 0,
            counterparty: '',
            advanced_by_user_id: '',
            note: '',
          },
    );
  }, [open, editing, defaultMonth, defaultDirection, reset]);

  if (!open) return null;

  const onSubmit = async (d: FormData) => {
    const payload = {
      direction: d.direction,
      occurred_on: d.occurred_on,
      category: d.category || null,
      item: d.item,
      amount: d.amount,
      counterparty: d.counterparty || null,
      advanced_by_user_id: d.direction === 'expense' && d.advanced_by_user_id ? d.advanced_by_user_id : null,
      note: d.note || null,
    };
    if (editing) await update.mutateAsync({ id: editing.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm(t('finance:ledger.deleteConfirm'))) return;
    await del.mutateAsync(editing.id);
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
        <h3 className="text-base font-semibold">
          {editing ? t('finance:ledger.edit') : t('finance:ledger.newRow')}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('finance:ledger.fields.direction')}>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('direction')}
              disabled={Boolean(editing?.linked_payment_record_id)}
            >
              <option value="income">{t('finance:ledger.income')}</option>
              <option value="expense">{t('finance:ledger.expense')}</option>
            </select>
          </Field>
          <Field label={t('finance:ledger.fields.occurredOn')}>
            <Input type="date" {...register('occurred_on')} />
          </Field>
          <Field label={t('finance:ledger.fields.category')}>
            <Input {...register('category')} />
          </Field>
          <Field label={t('finance:ledger.fields.amount')}>
            <Input type="number" step="1" {...register('amount')} />
          </Field>
        </div>

        <Field label={t('finance:ledger.fields.item')}>
          <Input {...register('item')} />
        </Field>
        <Field label={t('finance:ledger.fields.counterparty')}>
          <Input {...register('counterparty')} />
        </Field>
        {direction === 'expense' && (
          <Field label={t('finance:ledger.fields.advancedBy', '代墊人')}>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('advanced_by_user_id')}
            >
              <option value="">無 / 球隊公積金</option>
              {(profiles ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} (@{p.username})
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('finance:ledger.fields.note')}>
          <textarea
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('note')}
          />
        </Field>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleDelete()}
                className="gap-1 text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('finance:ledger.delete')}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}
