import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useCreateLeave, useCreateLeaveForPlayer } from '../api/leavesApi';
import { useUpcomingTeamEvents } from '../api/teamEventsApi';
import { fromDateTimeInputValue, formatDateTime, toDateTimeInputValue } from '@/shared/utils/dates';
import { useAuthStore } from '@/core/store/authStore';
import { useLinkedPlayers } from '@/modules/parents/api/parentsApi';
import type { LeaveReasonType } from '@/core/supabase/types';

const REASONS: LeaveReasonType[] = ['sick', 'personal', 'official', 'other'];

const schema = z
  .object({
    start_at: z.string().min(1),
    end_at: z.string().min(1),
    reason_type: z.enum(['sick', 'personal', 'official', 'other']),
    reason_text: z.string().optional(),
    affected_event_ids: z.array(z.string()).default([]),
  })
  .refine((d) => new Date(d.end_at) > new Date(d.start_at), {
    path: ['end_at'],
    message: 'endBeforeStart',
  });
type FormData = z.infer<typeof schema>;

interface LeaveFormProps {
  onSuccess?: () => void;
}

export function LeaveForm({ onSuccess }: LeaveFormProps) {
  const { t } = useTranslation();
  const upcoming = useUpcomingTeamEvents(14);
  const createLeave = useCreateLeave();
  const createLeaveForPlayer = useCreateLeaveForPlayer();

  // 判斷是否為家長角色
  const profile = useAuthStore((s) => s.profile);
  const isParent = profile?.role_names.includes('parent') ?? false;

  // 家長綁定的小孩清單
  const linkedQuery = useLinkedPlayers(isParent ? profile?.id : undefined);
  const linkedChildren = linkedQuery.data ?? [];

  // 家長選擇的「申請人」小孩 ID（預設為第一個小孩，若只有一個）
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const defaultStart = toDateTimeInputValue(new Date());
  const defaultEnd = toDateTimeInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_at: defaultStart,
      end_at: defaultEnd,
      reason_type: 'personal',
      reason_text: '',
      affected_event_ids: [],
    },
  });

  const resetDefaults = {
    start_at: defaultStart,
    end_at: defaultEnd,
    reason_type: 'personal' as const,
    reason_text: '',
    affected_event_ids: [],
  };

  const onSubmit = async (data: FormData) => {
    const base = {
      start_at: fromDateTimeInputValue(data.start_at),
      end_at: fromDateTimeInputValue(data.end_at),
      reason_type: data.reason_type,
      reason_text: data.reason_text,
      affected_event_ids: data.affected_event_ids,
    };

    if (isParent && selectedChildId) {
      // 家長代替小孩請假
      await createLeaveForPlayer.mutateAsync({ ...base, player_id: selectedChildId });
    } else {
      // 一般球員（或家長幫自己）請假
      await createLeave.mutateAsync(base);
    }

    reset(resetDefaults);
    onSuccess?.();
  };

  const isPending = isSubmitting || createLeave.isPending || createLeaveForPlayer.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">{t('leaves:form.newLeave')}</h2>

      {/* 家長視角：選擇要幫哪個小孩請假 */}
      {isParent && linkedChildren.length > 0 ? (
        <div className="space-y-1.5">
          <label htmlFor="apply_for" className="text-sm font-medium">
            {t('leaves:form.applyFor')}
          </label>
          <p className="text-xs text-muted-foreground">{t('leaves:form.applyForHint')}</p>
          <select
            id="apply_for"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
          >
            <option value="">-- {t('leaves:form.applyFor')} --</option>
            {linkedChildren.map((row) => (
              <option key={row.player_id} value={row.player_id}>
                {row.player.display_name} (@{row.player.username})
                {row.relationship ? ` · ${row.relationship}` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="start_at" className="text-sm font-medium">
            {t('leaves:form.startAt')}
          </label>
          <Input id="start_at" type="datetime-local" {...register('start_at')} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="end_at" className="text-sm font-medium">
            {t('leaves:form.endAt')}
          </label>
          <Input id="end_at" type="datetime-local" {...register('end_at')} />
          {errors.end_at?.message === 'endBeforeStart' ? (
            <p className="text-xs text-destructive">{t('leaves:validation.endBeforeStart')}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reason_type" className="text-sm font-medium">
          {t('leaves:form.reasonType')}
        </label>
        <select
          id="reason_type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('reason_type')}
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`leaves:reason.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reason_text" className="text-sm font-medium">
          {t('leaves:form.reasonText')}
        </label>
        <textarea
          id="reason_text"
          rows={2}
          placeholder={t('leaves:form.reasonPlaceholder')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('reason_text')}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('leaves:form.affectedEvents')}</label>
        <p className="text-xs text-muted-foreground">{t('leaves:form.affectedEventsHint')}</p>
        {upcoming.isLoading ? (
          <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
        ) : upcoming.data && upcoming.data.length > 0 ? (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
            {upcoming.data.map((ev) => (
              <label key={ev.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  value={ev.id}
                  className="mt-0.5"
                  {...register('affected_event_ids')}
                />
                <span>
                  <span className="font-medium">{ev.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDateTime(ev.starts_at)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('common.empty')}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? t('common.loading') : t('leaves:form.submit')}
      </Button>
    </form>
  );
}
