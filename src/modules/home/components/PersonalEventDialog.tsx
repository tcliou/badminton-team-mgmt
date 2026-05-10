import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import {
  useCreatePersonalEvent,
  useDeletePersonalEvent,
  useUpdatePersonalEvent,
} from '../api/calendarApi';
import { fromDateTimeInputValue, toDateTimeInputValue } from '@/shared/utils/dates';
import type { PersonalEventRow } from '@/core/supabase/types';

const schema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    path: ['ends_at'],
    message: 'endBeforeStart',
  });
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** 編輯既有事件；不傳代表新增 */
  event?: PersonalEventRow | null;
  /** 從 calendar 點空白格時帶進來的預設時間 */
  defaultStart?: Date;
}

export function PersonalEventDialog({ open, onClose, event, defaultStart }: Props) {
  const { t } = useTranslation();
  const create = useCreatePersonalEvent();
  const update = useUpdatePersonalEvent();
  const del = useDeletePersonalEvent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    if (event) {
      reset({
        title: event.title,
        description: event.description ?? '',
        starts_at: toDateTimeInputValue(event.starts_at),
        ends_at: toDateTimeInputValue(event.ends_at),
      });
    } else {
      const start = defaultStart ?? new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      reset({
        title: '',
        description: '',
        starts_at: toDateTimeInputValue(start),
        ends_at: toDateTimeInputValue(end),
      });
    }
  }, [open, event, defaultStart, reset]);

  if (!open) return null;

  const onSubmit = async (d: FormData) => {
    const payload = {
      title: d.title,
      description: d.description ?? null,
      starts_at: fromDateTimeInputValue(d.starts_at),
      ends_at: fromDateTimeInputValue(d.ends_at),
    };
    if (event) {
      await update.mutateAsync({ id: event.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!event) return;
    await del.mutateAsync(event.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-base font-semibold">
          {event ? t('common.edit') : t('home:personalEvent.add')}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('home:personalEvent.title')}</label>
            <Input {...register('title')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('home:personalEvent.startAt')}</label>
              <Input type="datetime-local" {...register('starts_at')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('home:personalEvent.endAt')}</label>
              <Input type="datetime-local" {...register('ends_at')} />
              {errors.ends_at?.message === 'endBeforeStart' ? (
                <p className="text-xs text-destructive">{t('leaves:validation.endBeforeStart')}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('home:personalEvent.note')}</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('description')}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {event ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleDelete()}
                  className="gap-1 text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t('common.delete')}
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
    </div>
  );
}
