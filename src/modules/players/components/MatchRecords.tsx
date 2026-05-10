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
import { useCreateMatch, useDeleteMatch, usePlayerMatches } from '../api/playersApi';

const CATEGORIES = ['singles', 'doubles_men', 'doubles_women', 'doubles_mixed', 'team'] as const;

const schema = z.object({
  event_name: z.string().min(1),
  event_date: z.string().min(1),
  category: z.enum(CATEGORIES),
  division: z.string().optional(),
  placement: z.string().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function MatchRecords({ playerId, canEdit }: { playerId: string; canEdit: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePlayerMatches(playerId);
  const create = useCreateMatch(playerId);
  const del = useDeleteMatch(playerId);
  const [adding, setAdding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'singles', event_date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (d: FormData) => {
    await create.mutateAsync({
      event_name: d.event_name,
      event_date: d.event_date,
      category: d.category,
      division: d.division ?? null,
      placement: d.placement ?? null,
      note: d.note ?? null,
    });
    reset();
    setAdding(false);
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('players:matches.title')}</h2>
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setAdding((s) => !s)} className="gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('players:matches.add')}
          </Button>
        ) : null}
      </header>

      {adding ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-3 grid gap-2 rounded-md border p-3 sm:grid-cols-2">
          <Input placeholder={t('players:matches.eventName')} {...register('event_name')} />
          <Input type="date" {...register('event_date')} />
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...register('category')}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`players:category.${c}`)}
              </option>
            ))}
          </select>
          <Input placeholder={t('players:matches.division')} {...register('division')} />
          <Input placeholder={t('players:matches.placement')} {...register('placement')} />
          <Input placeholder={t('players:matches.note')} {...register('note')} />
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
        <EmptyState title={t('players:matches.empty')} />
      ) : (
        <ul className="divide-y text-sm">
          {data.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{m.event_name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.event_date} · {t(`players:category.${m.category}`)}
                  {m.division ? ` · ${m.division}` : ''}
                  {m.placement ? ` · ${m.placement}` : ''}
                </p>
                {m.note ? <p className="mt-1 text-xs">{m.note}</p> : null}
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void del.mutateAsync(m.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label={t('players:matches.delete')}
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
