import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateForm } from '../api/enrollmentsApi';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Plus, X } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  dates: z.array(z.object({ value: z.string().min(1) })).min(1, 'Select at least one date'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateEnrollmentFormDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const createForm = useCreateForm();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', dates: [{ value: '' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dates',
  });

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    await createForm.mutateAsync({
      title: data.title,
      dates: data.dates.map((d) => d.value).sort(), // sort dates ascending
      status: 'published',
    });
    handleClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-4">
        <h2 className="mb-4 text-lg font-semibold">{t('enrollments:list.create')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:form.title')}</label>
            <Input {...register('title')} placeholder="e.g., 2026/05 團練表" autoFocus />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('enrollments:form.dates')}</label>
            <p className="text-xs text-muted-foreground">{t('enrollments:form.datesHint')}</p>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input type="date" {...register(`dates.${index}.value` as const)} required />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 px-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full gap-1"
              onClick={() => append({ value: '' })}
            >
              <Plus className="h-3.5 w-3.5" />
              新增日期
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('enrollments:form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || createForm.isPending}>
              {isSubmitting ? '...' : t('enrollments:form.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
