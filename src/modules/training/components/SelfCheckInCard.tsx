import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { useMyAttendanceToday, useSelfCheckIn } from '../api/trainingApi';
import { formatDateTime } from '@/shared/utils/dates';
import { cn } from '@/shared/utils/cn';

const STATUS_CLASSES = {
  present: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  late: 'border-amber-200 bg-amber-50/50 text-amber-700',
  on_leave: 'border-blue-200 bg-blue-50/50 text-blue-700',
  absent: 'border-rose-200 bg-rose-50/50 text-rose-700',
} as const;

export function SelfCheckInCard() {
  const { t } = useTranslation();
  const today = useMyAttendanceToday();
  const checkIn = useSelfCheckIn();

  if (today.isLoading) return <Loading />;
  if (!today.data || today.data.length === 0) return null;

  const handleCheckIn = (trainingId: string, status: 'present' | 'late') => {
    void checkIn.mutate({ trainingId, status });
  };

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <header className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-base font-semibold text-primary">{t('training:selfCheckIn.title')}</h2>
      </header>

      <ul className="space-y-2">
        {today.data.map(({ training, myRecord }) => {
          const event = training.event;
          const status = myRecord?.status;
          const checked = status === 'present' || status === 'late';

          return (
            <li
              key={training.id}
              className={cn(
                'rounded-lg border bg-card p-3 space-y-2 transition-colors',
                status && STATUS_CLASSES[status],
              )}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-sm">{event?.title ?? t('training:selfCheckIn.unnamed')}</p>
                  {event && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {formatDateTime(event.starts_at)}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  )}
                </div>

                {status ? (
                  <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0">
                    {t(`training:attendance.${statusKey(status)}`)}
                  </span>
                ) : null}
              </div>

              {/* 操作按鈕：已打卡後可改，未打卡顯示兩個選項 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={status === 'present' ? 'default' : 'outline'}
                  disabled={checkIn.isPending}
                  onClick={() => handleCheckIn(training.id, 'present')}
                  className="gap-1.5"
                >
                  {checked && status === 'present' ? '✓ ' : ''}
                  {t('training:attendance.present')}
                </Button>
                <Button
                  size="sm"
                  variant={status === 'late' ? 'default' : 'outline'}
                  disabled={checkIn.isPending}
                  onClick={() => handleCheckIn(training.id, 'late')}
                  className="gap-1.5"
                >
                  {checked && status === 'late' ? '✓ ' : ''}
                  {t('training:attendance.late')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">{t('training:selfCheckIn.hint')}</p>
    </section>
  );
}

function statusKey(s: string) {
  switch (s) {
    case 'present': return 'present';
    case 'absent': return 'absent';
    case 'on_leave': return 'onLeave';
    case 'late': return 'late';
    default: return 'present';
  }
}
