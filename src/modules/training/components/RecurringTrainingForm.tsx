import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useCreateRecurringTraining } from '../api/trainingApi';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const; // 週一到週日

const schema = z.object({
  title: z.string().min(1),
  topic: z.string().optional(),
  group_tag: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  weekdays: z.array(z.number()).min(1),
  weeks: z.coerce.number().int().min(1).max(52),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function RecurringTrainingForm({ onSuccess }: { onSuccess?: (count: number) => void }) {
  const { t } = useTranslation();
  const create = useCreateRecurringTraining();

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '訓練',
      startDate: today,
      startTime: '19:00',
      endTime: '21:00',
      weekdays: [2, 5],
      weeks: 8,
    },
  });

  const selectedWeekdays = watch('weekdays') ?? [];
  const toggleWeekday = (wd: number) => {
    const next = selectedWeekdays.includes(wd)
      ? selectedWeekdays.filter((x) => x !== wd)
      : [...selectedWeekdays, wd].sort();
    setValue('weekdays', next, { shouldValidate: true });
  };

  const onSubmit = async (data: FormOutput) => {
    const result = await create.mutateAsync({
      title: data.title,
      topic: data.topic,
      group_tag: data.group_tag,
      location: data.location,
      rule: {
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        weekdays: data.weekdays,
        weeks: data.weeks,
      },
    });
    reset();
    onSuccess?.(result.length);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{t('training:form.recurring')}</h3>
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
        <Field label={t('training:form.date')}>
          <Input type="date" {...register('startDate')} />
        </Field>
        <Field label={t('training:form.weeks')}>
          <Input type="number" min={1} max={52} {...register('weeks')} />
        </Field>
        <Field label={t('training:form.startTime')}>
          <Input type="time" {...register('startTime')} />
        </Field>
        <Field label={t('training:form.endTime')}>
          <Input type="time" {...register('endTime')} />
        </Field>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">{t('training:form.weekdays')}</label>
        <div className="flex flex-wrap gap-1">
          {WEEKDAYS.map((wd) => {
            const active = selectedWeekdays.includes(wd);
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleWeekday(wd)}
                className={`h-9 w-9 rounded-md border text-sm transition ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-accent'
                }`}
                aria-pressed={active}
              >
                {t(`training:weekday.${wd}`)}
              </button>
            );
          })}
        </div>
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
