import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { useAttendance, useUpsertAttendance, type TrainingWithEvent } from '../api/trainingApi';
import { QK } from '@/shared/utils/queryKeys';
import type { AttendanceStatus, ProfileRow } from '@/core/supabase/types';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'on_leave', 'late'];

type Marks = Record<string, AttendanceStatus>;

interface Props {
  training: TrainingWithEvent;
}

export function AttendancePanel({ training }: Props) {
  const { t } = useTranslation();
  const players = useActivePlayers();
  const attendance = useAttendance(training.id);
  const upsert = useUpsertAttendance();
  const overlapped = useLeavesOverlapping(training);

  const [marks, setMarks] = useState<Marks>({});

  // 已存的點名 → 帶入；其他人預設 present；已請假者預設 on_leave
  useEffect(() => {
    if (!players.data || !attendance.data) return;
    const recorded: Marks = {};
    attendance.data.forEach((a) => {
      recorded[a.player_id] = a.status;
    });
    const next: Marks = {};
    players.data.forEach((p) => {
      next[p.id] =
        recorded[p.id] ??
        (overlapped.data?.has(p.id) ? 'on_leave' : 'present');
    });
    setMarks(next);
  }, [players.data, attendance.data, overlapped.data]);

  const setMark = (playerId: string, status: AttendanceStatus) =>
    setMarks((m) => ({ ...m, [playerId]: status }));

  const handleSave = async () => {
    if (!players.data) return;
    await upsert.mutateAsync(
      players.data.map((p) => ({
        training_id: training.id,
        player_id: p.id,
        status: marks[p.id] ?? 'present',
      })),
    );
  };

  if (players.isLoading || attendance.isLoading) return <Loading />;
  if (!players.data) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">
        {t('training:attendance.title', { title: training.event?.title ?? '' })}
      </h3>

      <ul className="divide-y">
        {players.data.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm">
              {p.display_name}{' '}
              <span className="text-xs text-muted-foreground">@{p.username}</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMark(p.id, s)}
                  className={`rounded-md border px-2 py-1 text-xs transition ${
                    (marks[p.id] ?? 'present') === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  }`}
                  aria-pressed={(marks[p.id] ?? 'present') === s}
                >
                  {t(`training:attendance.${attendanceKey(s)}`)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => void handleSave()} disabled={upsert.isPending}>
          {upsert.isPending ? t('common.loading') : t('training:attendance.save')}
        </Button>
      </div>
    </div>
  );
}

function attendanceKey(s: AttendanceStatus): string {
  switch (s) {
    case 'present':
      return 'present';
    case 'absent':
      return 'absent';
    case 'on_leave':
      return 'onLeave';
    case 'late':
      return 'late';
  }
}

/** active 球員 */
function useActivePlayers() {
  return useQuery({
    queryKey: QK.profile.list,
    queryFn: async (): Promise<Pick<ProfileRow, 'id' | 'username' | 'display_name'>[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name')
        .eq('status', 'active')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** 該訓練時段內已 approved 的請假者 id set */
function useLeavesOverlapping(training: TrainingWithEvent) {
  return useQuery({
    queryKey: ['leaves-overlap', training.id],
    enabled: Boolean(training.event),
    queryFn: async (): Promise<Set<string>> => {
      if (!training.event) return new Set();
      const { data, error } = await supabase
        .from('leave_requests')
        .select('player_id')
        .eq('status', 'approved')
        .lte('start_at', training.event.ends_at)
        .gte('end_at', training.event.starts_at);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.player_id));
    },
  });
}

