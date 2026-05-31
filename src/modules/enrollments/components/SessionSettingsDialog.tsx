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
import { useCoaches } from '@/modules/coaches/api/coachesApi';

const schema = z.object({
  time: z.string(),
  location: z.string(),
  items: z.string(),
  notes: z.string(),
  equipment: z.string(),
  fee: z.string(),
  coaches: z.array(z.string()),
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
  const { data: coachesData } = useCoaches();

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
      const existing = form.session_details?.[date] as Record<string, unknown> | undefined;
      reset({
        time: (existing?.time as string) ?? defaultSessionDetails.time,
        location: (existing?.location as string) ?? defaultSessionDetails.location,
        items: (existing?.items as string) ?? defaultSessionDetails.items,
        notes: (existing?.notes as string) ?? defaultSessionDetails.notes,
        equipment: (existing?.equipment as string) ?? defaultSessionDetails.equipment,
        fee: (existing?.fee as string) ?? defaultSessionDetails.fee,
        coaches: Array.isArray(existing?.coaches) ? existing.coaches : defaultSessionDetails.coaches,
      });
    }
  }, [open, form, date, reset]);

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    let safeDate = date;
    const match = date.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (match) {
      safeDate = match[1] as string;
    }
    const map = new Map(Object.entries(form.session_details || {}));
    map.set(safeDate, data);
    const newSessionDetails = Object.fromEntries(map);
    
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
            <div className="flex flex-wrap gap-4">
              {coachesData?.filter(c => c.is_active).map(coach => (
                <label key={coach.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={coach.id}
                    {...register('coaches')}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{coach.name}</span>
                </label>
              ))}
              {(!coachesData || coachesData.filter(c => c.is_active).length === 0) && (
                <span className="text-sm text-muted-foreground">尚無可選擇的教練，請先至教練模組新增。</span>
              )}
            </div>
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
