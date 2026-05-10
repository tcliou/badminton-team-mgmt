import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useUpdateProfile } from '../api/playersApi';
import type { ProfileRow } from '@/core/supabase/types';

const schema = z.object({
  display_name: z.string().min(1),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  dominant_hand: z.enum(['left', 'right', 'both']).optional().or(z.literal('')),
  height_cm: z.coerce.number().int().min(0).max(280).optional().or(z.nan()),
  weight_kg: z.coerce.number().min(0).max(300).optional().or(z.nan()),
  favorite_racket: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  profile: ProfileRow;
  canEdit: boolean;
}

export function ProfileEditCard({ profile, canEdit }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const update = useUpdateProfile(profile.id);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile.display_name,
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      birthday: profile.birthday ?? '',
      dominant_hand: profile.dominant_hand ?? '',
      height_cm: profile.height_cm ?? undefined,
      weight_kg: profile.weight_kg ?? undefined,
      favorite_racket: profile.favorite_racket ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await update.mutateAsync({
      display_name: data.display_name,
      email: data.email ? data.email : null,
      phone: data.phone ? data.phone : null,
      birthday: data.birthday ? data.birthday : null,
      dominant_hand: data.dominant_hand ? (data.dominant_hand as 'left' | 'right' | 'both') : null,
      height_cm: Number.isFinite(data.height_cm) ? (data.height_cm as number) : null,
      weight_kg: Number.isFinite(data.weight_kg) ? (data.weight_kg as number) : null,
      favorite_racket: data.favorite_racket ? data.favorite_racket : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setEditing(false);
  };

  if (!editing) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{profile.display_name}</h2>
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1">
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t('players:profile.edit')}
            </Button>
          ) : null}
        </header>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Field k="email" v={profile.email} />
          <Field k="phone" v={profile.phone} />
          <Field k="birthday" v={profile.birthday} />
          <Field
            k="dominantHand"
            v={profile.dominant_hand ? t(`players:profile.hand.${profile.dominant_hand}`) : null}
          />
          <Field k="height" v={profile.height_cm ? `${profile.height_cm}` : null} />
          <Field k="weight" v={profile.weight_kg ? `${profile.weight_kg}` : null} />
          <Field k="favoriteRacket" v={profile.favorite_racket} />
        </dl>
        {saved ? (
          <p className="mt-3 text-xs text-emerald-600">{t('players:profile.saved')}</p>
        ) : null}
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">{t('players:profile.edit')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldEdit label={t('players:profile.labels.displayName')}>
          <Input {...register('display_name')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.email')}>
          <Input type="email" {...register('email')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.phone')}>
          <Input {...register('phone')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.birthday')}>
          <Input type="date" {...register('birthday')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.dominantHand')}>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('dominant_hand')}
          >
            <option value="">--</option>
            <option value="left">{t('players:profile.hand.left')}</option>
            <option value="right">{t('players:profile.hand.right')}</option>
            <option value="both">{t('players:profile.hand.both')}</option>
          </select>
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.favoriteRacket')}>
          <Input {...register('favorite_racket')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.height')}>
          <Input type="number" step="1" {...register('height_cm')} />
        </FieldEdit>
        <FieldEdit label={t('players:profile.labels.weight')}>
          <Input type="number" step="0.1" {...register('weight_kg')} />
        </FieldEdit>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || update.isPending}>
          {isSubmitting || update.isPending ? t('common.loading') : t('players:profile.save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setEditing(false);
          }}
        >
          {t('players:profile.cancel')}
        </Button>
      </div>
    </form>
  );
}

function Field({ k, v }: { k: string; v: string | number | null | undefined }) {
  const { t } = useTranslation();
  return (
    <>
      <dt className="text-muted-foreground">{t(`players:profile.labels.${k}`)}</dt>
      <dd className="font-medium">{v == null || v === '' ? '—' : v}</dd>
    </>
  );
}

function FieldEdit({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}
