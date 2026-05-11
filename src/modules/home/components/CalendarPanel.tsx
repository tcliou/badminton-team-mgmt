import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { CalendarDays, Plus } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import {
  useApprovedLeavesInRange,
  usePersonalEvents,
  useTeamEvents,
  type ApprovedLeaveWithPlayer,
} from '../api/calendarApi';
import { PersonalEventDialog } from './PersonalEventDialog';
import { EventDetailsOverlay, type DetailsTarget } from './EventDetailsOverlay';
import { Button } from '@/shared/components/Button';
import type { CalendarEventRow, PersonalEventRow } from '@/core/supabase/types';

const TEAM_COLOR = '#3b82f6';
const PERSONAL_COLOR = '#10b981';
const LEAVE_COLOR = '#f59e0b';

export function CalendarPanel() {
  const { t, i18n } = useTranslation();
  const calRef = useRef<FullCalendar | null>(null);

  // ⚠️ 必須 useMemo：直接 new Date() 在 render body 會讓每次 render 產生
  // 不同的時間戳，傳到 useQuery 的 queryKey 也跟著變，造成 TanStack Query
  // 每次 render 都判定 key 變了→重新 fetch→re-render→…無限循環。
  const { rangeFrom, rangeTo } = useMemo(() => {
    const today = new Date();
    return { rangeFrom: subMonths(today, 1), rangeTo: addMonths(today, 2) };
  }, []);

  const team = useTeamEvents(rangeFrom, rangeTo);
  const personal = usePersonalEvents(rangeFrom, rangeTo);
  const leaves = useApprovedLeavesInRange(rangeFrom, rangeTo);

  const [showTeam, setShowTeam] = useState(true);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showLeaves, setShowLeaves] = useState(true);

  // 編輯個人事件用的 dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalEventRow | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>();

  // 點事件展開的詳情 overlay
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<DetailsTarget | null>(null);

  const events = useMemo<EventInput[]>(() => {
    const out: EventInput[] = [];
    if (showTeam && team.data) {
      team.data.forEach((ev) => {
        out.push({
          id: `team-${ev.id}`,
          title: ev.title,
          start: ev.starts_at,
          end: ev.ends_at,
          backgroundColor: ev.color ?? TEAM_COLOR,
          borderColor: ev.color ?? TEAM_COLOR,
          extendedProps: { kind: 'team', raw: ev },
        });
      });
    }
    if (showPersonal && personal.data) {
      personal.data.forEach((ev) => {
        out.push({
          id: `personal-${ev.id}`,
          title: ev.title,
          start: ev.starts_at,
          end: ev.ends_at,
          backgroundColor: ev.color ?? PERSONAL_COLOR,
          borderColor: ev.color ?? PERSONAL_COLOR,
          extendedProps: { kind: 'personal', raw: ev },
        });
      });
    }
    if (showLeaves && leaves.data) {
      leaves.data.forEach((lv) => {
        out.push({
          id: `leave-${lv.id}`,
          title: t('home:calendarLegend.leaveTag'),
          start: lv.start_at,
          end: lv.end_at,
          backgroundColor: LEAVE_COLOR,
          borderColor: LEAVE_COLOR,
          display: 'background',
          extendedProps: { kind: 'leave' },
        });
      });
    }
    return out;
  }, [team.data, personal.data, leaves.data, showTeam, showPersonal, showLeaves, t]);

  /** 找出哪些已核准請假的 affected_event_ids 包含這個 calendar_event id */
  const findAffectedLeaves = (calendarEventId: string): ApprovedLeaveWithPlayer[] => {
    if (!leaves.data) return [];
    return leaves.data.filter((lv) =>
      (lv.affected_event_ids ?? []).includes(calendarEventId),
    );
  };

  const handleEventClick = (arg: EventClickArg) => {
    const kind = arg.event.extendedProps.kind as 'team' | 'personal' | 'leave';
    if (kind === 'team') {
      const row = arg.event.extendedProps.raw as CalendarEventRow;
      setDetailsTarget({
        kind: 'team',
        row,
        affectedLeaves: findAffectedLeaves(row.id),
      });
      setDetailsOpen(true);
    } else if (kind === 'personal') {
      const row = arg.event.extendedProps.raw as PersonalEventRow;
      setDetailsTarget({ kind: 'personal', row });
      setDetailsOpen(true);
    }
    // 'leave' 是背景事件，FullCalendar 預設不會觸發 click
  };

  const openCreatePersonal = (start?: Date) => {
    setEditing(null);
    setDefaultStart(start);
    setDialogOpen(true);
  };

  const openEditPersonal = (row: PersonalEventRow) => {
    setDetailsOpen(false);
    setEditing(row);
    setDefaultStart(undefined);
    setDialogOpen(true);
  };

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          {t('home:sections.calendar')}
        </h2>
        <Button size="sm" onClick={() => openCreatePersonal()} className="gap-1">
          <Plus className="h-4 w-4" aria-hidden />
          {t('home:personalEvent.add')}
        </Button>
      </header>

      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        <Legend
          checked={showTeam}
          onChange={setShowTeam}
          color={TEAM_COLOR}
          label={t('home:sections.teamEvents')}
        />
        <Legend
          checked={showPersonal}
          onChange={setShowPersonal}
          color={PERSONAL_COLOR}
          label={t('home:sections.personalEvents')}
        />
        <Legend
          checked={showLeaves}
          onChange={setShowLeaves}
          color={LEAVE_COLOR}
          label={t('home:calendarLegend.leaves')}
        />
      </div>

      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView={typeof window !== 'undefined' && window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth'}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek',
        }}
        height="auto"
        locale={i18n.resolvedLanguage === 'en' ? 'en' : 'zh-tw'}
        firstDay={1}
        events={events}
        eventClick={handleEventClick}
        dateClick={(arg) => openCreatePersonal(arg.date)}
        eventDisplay="block"
      />

      <EventDetailsOverlay
        open={detailsOpen}
        target={detailsTarget}
        onClose={() => setDetailsOpen(false)}
        onEditPersonal={openEditPersonal}
      />

      <PersonalEventDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        event={editing}
        defaultStart={defaultStart}
      />
    </section>
  );
}

function Legend({
  checked,
  onChange,
  color,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </label>
  );
}
