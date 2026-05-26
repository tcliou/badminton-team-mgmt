import { useTranslation } from 'react-i18next';
import { CalendarDays, MapPin, Pencil, UserMinus, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { formatDateTime } from '@/shared/utils/dates';
import type {
  CalendarEventRow,
  PersonalEventRow,
} from '@/core/supabase/types';
import type { ApprovedLeaveWithPlayer } from '../api/calendarApi';

export type DetailsTarget =
  | { kind: 'team'; row: CalendarEventRow; affectedLeaves: ApprovedLeaveWithPlayer[] }
  | { kind: 'personal'; row: PersonalEventRow };

interface Props {
  open: boolean;
  target: DetailsTarget | null;
  onClose: () => void;
  /** 個人行程的編輯按鈕 */
  onEditPersonal?: (row: PersonalEventRow) => void;
}

const TYPE_COLOR: Record<string, string> = {
  training: 'bg-blue-100 text-blue-800',
  match: 'bg-purple-100 text-purple-800',
  meeting: 'bg-amber-100 text-amber-800',
  other: 'bg-slate-100 text-slate-800',
};

export function EventDetailsOverlay({ open, target, onClose, onEditPersonal }: Props) {
  const { t } = useTranslation();
  if (!open || !target) return null;

  // 從 discriminated union 解出統一欄位 + team 特有欄位
  // 不能寫成 `const row = target.row` 再判斷 isTeam，TS 沒法用變數做 narrowing
  const { row } = target;
  const start = row.starts_at;
  const end = row.ends_at;
  const description = row.description;
  const teamRow = target.kind === 'team' ? target.row : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {teamRow ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    TYPE_COLOR[teamRow.event_type] ?? TYPE_COLOR.other
                  }`}
                >
                  {t(`calendar:calendarLegend.eventType.${teamRow.event_type}`)}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  {t('calendar:sections.personalEvents')}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold">{row.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CalendarDays
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>
              {formatDateTime(start)} – {formatDateTime(end)}
            </span>
          </div>
          {teamRow?.location ? (
            <div className="flex items-start gap-2">
              <MapPin
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>{teamRow.location}</span>
            </div>
          ) : null}
          {description ? (
            <div className="rounded-md bg-muted/40 p-2 text-sm whitespace-pre-wrap">
              {description}
            </div>
          ) : null}
        </dl>

        {/* 球隊事件：列出已核准請假名單 */}
        {target.kind === 'team' && target.affectedLeaves.length > 0 ? (
          <section className="mt-4 rounded-md border bg-amber-50/50 p-3">
            <h3 className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-800">
              <UserMinus className="h-3.5 w-3.5" aria-hidden />
              {t('calendar:eventDetails.leaveList', { count: target.affectedLeaves.length })}
            </h3>
            <ul className="space-y-1 text-sm">
              {target.affectedLeaves.map((lv) => (
                <li key={lv.id} className="text-foreground/90">
                  {lv.player?.display_name ?? '?'}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({t(`leaves:reason.${lv.reason_type}`)})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="mt-5 flex items-center justify-end gap-2">
          {target.kind === 'personal' && onEditPersonal ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onEditPersonal(target.row)}
              className="gap-1"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {t('common.edit')}
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            {t('common.confirm')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
