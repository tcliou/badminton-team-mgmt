import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useCreateSingleTraining } from '../api/trainingApi';
import { fromDateTimeInputValue, toDateTimeInputValue } from '@/shared/utils/dates';

const schema = z
  .object({
    title: z.string().min(1),
    topic: z.string().optional(),
    group_tag: z.string().optional(),
    location: z.string().optional(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    path: ['ends_at'],
    message: 'endBeforeStart',
  });
type FormData = z.infer<typeof schema>;

export function SingleTrainingForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const create = useCreateSingleTraining();

  const start = toDateTimeInputValue(new Date());
  const end = toDateTimeInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '訓練', starts_at: start, ends_at: end },
  });

  const onSubmit = async (data: FormData) => {
    await create.mutateAsync({
      title: data.title,
      topic: data.topic,
      group_tag: data.group_tag,
      location: data.location,
      starts_at: fromDateTimeInputValue(data.starts_at),
      ends_at: fromDateTimeInputValue(data.ends_at),
    });
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{t('training:form.single')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('training:form.title')}>
          <Input {...register('title')} />
        </Field>
        <Field label={t('training:form.topic')}>
          <Input {...register('topic')} />
        </Field>
        <Field label={t('training:form.location')}>
          <Input {...register('location')} />
        </Field>
        <Field label={t('training:form.groupTag')}>
          <Input {...register('group_tag')} />
        </Field>
        <Field label={t('training:form.startTime')}>
          <Input type="datetime-local" {...register('starts_at')} />
        </Field>
        <Field label={t('training:form.endTime')}>
          <Input type="datetime-local" {...register('ends_at')} />
          {errors.ends_at?.message === 'endBeforeStart' ? (
            <p className="text-xs text-destructive">{t('leaves:validation.endBeforeStart')}</p>
          ) : null}
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting || create.isPending}>
        {isSubmitting || create.isPending ? t('common.loading') : t('training:form.submit')}
      </Button>
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
