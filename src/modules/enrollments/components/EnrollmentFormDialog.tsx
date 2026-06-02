import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCreateForm, useUpdateForm, useDeleteForm } from '../api/enrollmentsApi';
import type { TrainingEnrollmentFormRow } from '@/core/supabase/types';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Plus, X, Trash2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().nullable(),
  dates: z.array(z.object({ value: z.string().min(1) })).min(1, 'Select at least one date'),
  generate_sessions: z.boolean().default(true),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  form?: TrainingEnrollmentFormRow | null; // if provided, it's edit mode
}

export function EnrollmentFormDialog({ open, onClose, form }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createForm = useCreateForm();
  const updateForm = useUpdateForm(form?.id || '');
  const deleteForm = useDeleteForm();

  const isEdit = !!form;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', dates: [{ value: '' }], generate_sessions: true },
  });

  useEffect(() => {
    if (open && form) {
      reset({
        title: form.title,
        description: form.description || '',
        dates: form.dates.length > 0 ? form.dates.map(d => ({ value: d })) : [{ value: '' }],
        generate_sessions: form.generate_sessions ?? true
      });
    } else if (open && !form) {
      reset({ title: '', description: '1 為已報名\n0 為報名整季，但當天請假\n\n📌 報名規則\n1. 整季報名：基礎訓練費計算，可請假一次並辦理退費。\n2. 預先當週單堂報名：基礎訓練費 + 60 元，請假不退費。\n3. 當週單堂報名：基礎訓練費 + 100 元。\n\n※ 每週球員訓練總人數上限為 24 位。', dates: [{ value: '' }], generate_sessions: true });
    }
  }, [open, form, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dates',
  });

  if (!open) return null;

  const onSubmit = async (data: FormOutput) => {
    const payload = {
      title: data.title,
      description: data.description,
      dates: data.dates.map((d) => d.value).sort(), // sort dates ascending
      generate_sessions: data.generate_sessions,
      status: 'published' as const,
    };

    if (isEdit) {
      await updateForm.mutateAsync(payload);
    } else {
      await createForm.mutateAsync(payload);
    }
    handleClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDelete = async () => {
    if (!form) return;
    if (!window.confirm('確定要刪除此報名表嗎？這將會刪除所有相關的報名資料，且無法復原。')) return;
    await deleteForm.mutateAsync(form.id);
    handleClose();
    navigate('/enrollments');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">
          {isEdit ? t('enrollments:detail.settings') : t('enrollments:list.create')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:form.title')}</label>
            <Input {...register('title')} placeholder="e.g., 2026/05 團練表" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('enrollments:form.description')}</label>
            <textarea
              {...register('description')}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
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

          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="checkbox"
              id="generate_sessions"
              {...register('generate_sessions')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="generate_sessions" className="text-sm font-medium">
              {t('enrollments:form.generateSessions')}
            </label>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              {isEdit && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  onClick={handleDelete}
                  disabled={deleteForm.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  刪除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('enrollments:form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || createForm.isPending || updateForm.isPending || deleteForm.isPending}>
                {isSubmitting ? '...' : t('enrollments:form.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
