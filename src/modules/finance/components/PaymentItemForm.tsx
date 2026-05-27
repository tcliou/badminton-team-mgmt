import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { useActivePlayers } from '@/modules/players/api/playersApi';
import {
  useCreatePaymentItem,
  useDeletePaymentItem,
  useUpdatePaymentItem,
} from '../api/paymentItemsApi';
import type { PaymentItemRow } from '@/core/supabase/types';

const schema = z.object({
  name: z.string().min(1),
  purpose: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive(),
  due_date: z.string().optional(),
  target_role_ids: z.array(z.string()).default([]),
  target_user_ids: z.array(z.string()).default([]),
  status: z.enum(['active', 'closed']),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function PaymentItemForm({
  editing,
  onDone,
}: {
  editing?: PaymentItemRow | null;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const roles = useAllRoles();
  const players = useActivePlayers();
  const create = useCreatePaymentItem();
  const update = useUpdatePaymentItem();
  const del = useDeletePaymentItem();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editing?.name ?? '',
      purpose: editing?.purpose ?? '',
      description: editing?.description ?? '',
      amount: editing?.amount ?? 0,
      due_date: editing?.due_date ?? '',
      target_role_ids: editing?.target_role_ids ?? [],
      target_user_ids: editing?.target_user_ids ?? [],
      status: editing?.status ?? 'active',
    },
  });

  const onSubmit = async (d: FormOutput) => {
    const payload = {
      name: d.name,
      purpose: d.purpose || null,
      description: d.description || null,
      amount: d.amount,
      due_date: d.due_date || null,
      target_role_ids: d.target_role_ids,
      target_user_ids: d.target_user_ids,
      status: d.status,
    };
    if (editing) await update.mutateAsync({ id: editing.id, ...payload });
    else await create.mutateAsync(payload);
    onDone?.();
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm(t('finance:items.deleteConfirm'))) return;
    await del.mutateAsync(editing.id);
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">
        {editing ? t('finance:items.edit') : t('finance:items.new')}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('finance:items.name')}>
          <Input {...register('name')} />
        </Field>
        <Field label={t('finance:items.purpose')}>
          <Input {...register('purpose')} />
        </Field>
        <Field label={t('finance:items.amount')}>
          <Input type="number" step="1" {...register('amount')} />
        </Field>
        <Field label={t('finance:items.dueDate')}>
          <Input type="date" {...register('due_date')} />
        </Field>
      </div>

      <Field label={t('finance:items.description')}>
        <textarea
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('description')}
        />
      </Field>

      <fieldset className="space-y-2 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium">{t('finance:items.target')}</legend>
        <p className="text-xs text-muted-foreground">{t('finance:items.targetAll')}</p>
        <div>
          <p className="mb-1 text-xs font-medium">{t('finance:items.targetByRole')}</p>
          <div className="flex flex-wrap gap-2">
            {roles.data?.map((r) => (
              <label key={r.id} className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  value={r.id}
                  {...register('target_role_ids')}
                  className="accent-primary"
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium">{t('finance:items.targetByUser')}</p>
          <div className="max-h-32 flex flex-wrap gap-2 overflow-y-auto rounded border p-2">
            {players.data?.map((p) => (
              <label key={p.id} className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  value={p.id}
                  {...register('target_user_ids')}
                  className="accent-primary"
                />
                {p.display_name}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <Field label={t('finance:items.status')}>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          {...register('status')}
        >
          <option value="active">{t('finance:items.active')}</option>
          <option value="closed">{t('finance:items.closed')}</option>
        </select>
      </Field>

      <div className="flex items-center justify-between gap-2">
        <div>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleDelete()}
              className="gap-1 text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('finance:items.delete')}
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onDone?.()}>
            {t('finance:items.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('finance:items.save')}
          </Button>
        </div>
      </div>
    </form>
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
