import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateForm } from '../api/enrollmentsApi';
import type { TrainingEnrollmentFormRow } from '@/core/supabase/types';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { defaultSessionDetails } from '../constants';

const schema = z.object({
  time: z.string(),
  location: z.string(),
  items: z.string(),
  notes: z.string(),
  equipment: z.string(),
  fee: z.string(),
  coaches: z.string(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  form: TrainingEnrollmentFormRow;
  date: string;
}

export function SessionSettingsDialog({ open, onClose, form, date }: Props) {
  const { t } = useTranslation();
  const updateForm = useUpdateForm(form.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultSessionDetails,
  });

  useEffect(() => {
    if (open) {
      const existing = form.session_details?.[date] as Partial<FormData> | undefined;
      reset({
        time: existing?.time ?? defaultSessionDetails.time,
        location: existing?.location ?? defaultSessionDetails.location,
        items: existing?.items ?? defaultSessionDetails.items,
        notes: existing?.notes ?? defaultSessionDetails.notes,
        equipment: existing?.equipment ?? defaultSessionDetails.equipment,
        fee: existing?.fee ?? defaultSessionDetails.fee,
        coaches: existing?.coaches ?? defaultSessionDetails.coaches,
      });
    }
  }, [open, form, date, reset]);

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    const newSessionDetails = { ...form.session_details, [date]: data };
    await updateForm.mutateAsync({ session_details: newSessionDetails });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">{t('enrollments:detail.sessionSettings')} - {date}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.time')}</label>
            <Input {...register('time')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.location')}</label>
            <Input {...register('location')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.items')}</label>
            <Input {...register('items')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.notes')}</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.equipment')}</label>
            <Input {...register('equipment')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.fee')}</label>
            <Input {...register('fee')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:detail.sessionDetails.coaches')}</label>
            <Input {...register('coaches')} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('enrollments:form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || updateForm.isPending}>
              {isSubmitting ? '...' : t('enrollments:form.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
