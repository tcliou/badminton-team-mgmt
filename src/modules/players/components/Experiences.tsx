import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { useCreateExperience, useDeleteExperience, usePlayerExperiences } from '../api/playersApi';

const ymRegex = /^\d{4}-\d{2}$/;
const schema = z.object({
  start_ym: z.string().regex(ymRegex),
  end_ym: z.string().regex(ymRegex).optional().or(z.literal('')),
  organization: z.string().min(1),
  role: z.string().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function Experiences({ playerId, canEdit }: { playerId: string; canEdit: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePlayerExperiences(playerId);
  const create = useCreateExperience(playerId);
  const del = useDeleteExperience(playerId);
  const [adding, setAdding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { start_ym: new Date().toISOString().slice(0, 7) },
  });

  const onSubmit = async (d: FormData) => {
    await create.mutateAsync({
      start_ym: d.start_ym,
      end_ym: d.end_ym ? d.end_ym : null,
      organization: d.organization,
      role: d.role ?? null,
      note: d.note ?? null,
    });
    reset();
    setAdding(false);
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('players:experiences.title')}</h2>
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setAdding((s) => !s)} className="gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('players:experiences.add')}
          </Button>
        ) : null}
      </header>

      {adding ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-3 grid gap-2 rounded-md border p-3 sm:grid-cols-2">
          <Input placeholder={t('players:experiences.startYm')} {...register('start_ym')} />
          <Input placeholder={t('players:experiences.endYm')} {...register('end_ym')} />
          <Input placeholder={t('players:experiences.organization')} {...register('organization')} />
          <Input placeholder={t('players:experiences.role')} {...register('role')} />
          <Input placeholder={t('players:experiences.note')} {...register('note')} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={isSubmitting || create.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('players:experiences.empty')} />
      ) : (
        <ul className="divide-y text-sm">
          {data.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{e.organization}</p>
                <p className="text-xs text-muted-foreground">
                  {e.start_ym} – {e.end_ym ?? '至今'} {e.role ? `· ${e.role}` : ''}
                </p>
                {e.note ? <p className="mt-1 text-xs">{e.note}</p> : null}
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void del.mutateAsync(e.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label={t('players:experiences.delete')}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
