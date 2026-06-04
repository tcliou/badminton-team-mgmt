import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useEnrollmentForm, useEnrollmentRows, useUpdateRow } from '../api/enrollmentsApi';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { Settings } from 'lucide-react';
import type { TrainingEnrollmentRowRow } from '@/core/supabase/types';
import { SessionSettingsDialog } from '../components/SessionSettingsDialog';
import { MobileEnrollmentCard } from '../components/MobileEnrollmentCard';
import { defaultSessionDetails } from '../constants';
import { useState, useMemo } from 'react';
import { useCoaches } from '@/modules/coaches/api/coachesApi';
import { useLinkedPlayers } from '@/modules/parents/api/parentsApi';
import type { EnrollmentRowWithPlayer } from '../api/enrollmentsApi';
import type { AuthProfile } from '@/core/store/authStore';

interface DesktopTableProps {
  rows: EnrollmentRowWithPlayer[];
  date: string;
  canManage: boolean;
  currentUser?: AuthProfile | null;
  linkedPlayerIds: Set<string>;
  handleCellChange: (rowId: string, field: 'daily_status' | 'daily_info' | 'enrollment_type' | 'date_records', value: string | number, currentRow: TrainingEnrollmentRowRow) => void;
  getRowBgColor: (type: string | null) => string;
  t: (key: string) => string;
}

export function EnrollmentSessionPage() {
  const { id, date } = useParams<{ id: string; date: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const formQuery = useEnrollmentForm(id!);
  const rowsQuery = useEnrollmentRows(id!);
  const { data: coachesData } = useCoaches();
  const updateRow = useUpdateRow();
  
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes(PERMISSIONS.ActionTrainingManage) ?? false;
  const { data: linkedPlayers } = useLinkedPlayers(currentUser?.id);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overallOpen, setOverallOpen] = useState(false);

  const handleCellChange = (
    rowId: string,
    field: 'daily_status' | 'daily_info' | 'enrollment_type' | 'date_records',
    value: string | number,
    currentRow: TrainingEnrollmentRowRow
  ) => {
    const allowedFields = ['daily_status', 'daily_info', 'enrollment_type', 'date_records', 'note'];
    if (!allowedFields.includes(field)) return;

    let safeDate = '';
    if (date) {
      const match = date.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (!match) return; // Drop invalid date injections
      safeDate = match[1] as string;
    }

    const patch: Partial<TrainingEnrollmentRowRow> = {};
    if (field === 'daily_status') {
      const map = new Map(Object.entries(currentRow.daily_status || {}));
      map.set(safeDate, value as string);
      patch.daily_status = Object.fromEntries(map);
    } else if (field === 'daily_info') {
      const map = new Map(Object.entries(currentRow.daily_info || {}));
      map.set(safeDate, value as string);
      patch.daily_info = Object.fromEntries(map);
    } else if (field === 'date_records') {
      const map = new Map(Object.entries(currentRow.date_records || {}));
      map.set(safeDate, value as number);
      patch.date_records = Object.fromEntries(map);
    } else {
      if (field === 'enrollment_type') patch.enrollment_type = value as string;
    }
    updateRow.mutate({ id: rowId, patch });
  };

  const getRowBgColor = (type: string | null) => {
    switch (type) {
      case 'season': return 'bg-amber-50';
      case 'pre_single': return 'bg-yellow-50';
      case 'skip': return 'bg-blue-50';
      default: return 'bg-card';
    }
  };

  if (formQuery.isLoading || rowsQuery.isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}...</div>;
  }

  if (!formQuery.data || !date) return null;

  const rows = rowsQuery.data || [];
  
  const attendingRows = rows.filter(r => {
    if (r.date_records[date] === 1 || r.daily_status[date] === 'need_single') return true;
    if (r.date_records[date] === 0 || r.daily_status[date] === 'leave_of_absence') return false;
    if (r.enrollment_type === 'season') return true;
    return false;
  });
  const totalPlayers = attendingRows.length;
  const seasonCount = attendingRows.filter(r => r.enrollment_type === 'season').length;
  const preSingleCount = attendingRows.filter(r => r.enrollment_type === 'pre_single').length;
  const singleCount = attendingRows.length - seasonCount - preSingleCount;
  
  const sessionDetailsRaw = formQuery.data.session_details?.[date] || {};
  const sessionDetails = {
    ...defaultSessionDetails,
    ...(sessionDetailsRaw as Record<string, unknown>)
  };
  const coachNames = Array.isArray(sessionDetails.coaches) 
    ? sessionDetails.coaches.map((coachId: string) => coachesData?.find(c => c.id === coachId)?.name || coachId).join('、')
    : sessionDetails.coaches || '無';

  // Filter My Rows
  const linkedPlayerIds = new Set(linkedPlayers?.map(lp => lp.player_id) || []);
  const myRows = rows.filter(
    (row) => row.player.id === currentUser?.id || linkedPlayerIds.has(row.player.id)
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/enrollments')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {formQuery.data.title} - {date} 場次
          </h1>
        </div>
        {canManage && (
          <Button variant="outline" className="gap-2" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            {t('enrollments:detail.sessionSettings')}
          </Button>
        )}
      </header>

      <div className="rounded-xl border bg-card p-4 shadow-sm text-sm space-y-2">
        <h3 className="font-semibold mb-2 text-primary">個別場次公告事項</h3>
        <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <p>● {t('enrollments:detail.sessionDetails.time')}： {sessionDetails.time}</p>
          <p>● {t('enrollments:detail.sessionDetails.location')}： {sessionDetails.location}</p>
          <p>● {t('enrollments:detail.sessionDetails.items')}： {sessionDetails.items}</p>
          <p>● {t('enrollments:detail.sessionDetails.equipment')}： {sessionDetails.equipment}</p>
          <p>● {t('enrollments:detail.sessionDetails.fee')}： {sessionDetails.fee}</p>
          <p>● {t('enrollments:detail.sessionDetails.coaches')}： {coachNames}</p>
          <p className="sm:col-span-2">● {t('enrollments:detail.sessionDetails.notes')}： {sessionDetails.notes}</p>
          <p className="font-bold text-primary sm:col-span-2">
            ● {t('enrollments:detail.sessionDetails.totalPlayers')}： {totalPlayers} 名
            <span className="text-muted-foreground text-xs font-normal ml-2 block sm:inline mt-1 sm:mt-0">
              (整季報名 {seasonCount} 位 + 預先當週單堂報名且本週出席 {preSingleCount} 位 + 單堂報名 {singleCount} 位)
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-primary">出席回報</h3>
        
        {myRows.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            目前無相關球員資料
          </div>
        ) : (
          <>
            {/* 桌面版 */}
            <div className="hidden md:block w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
              <DesktopTable 
                rows={myRows} 
                date={date} 
                canManage={canManage} 
                currentUser={currentUser} 
                linkedPlayerIds={linkedPlayerIds}
                handleCellChange={handleCellChange}
                getRowBgColor={getRowBgColor}
                t={t}
              />
            </div>
            {/* 手機版 */}
            <div className="md:hidden flex flex-col gap-3">
              {myRows.map(row => (
                <MobileEnrollmentCard
                  key={row.id}
                  row={row}
                  date={date}
                  canEdit={true}
                  handleCellChange={handleCellChange}
                  getRowBgColor={getRowBgColor}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <details 
        className="group rounded-xl border bg-card shadow-sm overflow-hidden" 
        open={overallOpen}
        onToggle={(e) => setOverallOpen(e.currentTarget.open)}
      >
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 font-semibold text-primary hover:bg-muted/50">
          本場次出席狀況總表
          <ChevronLeft className={clsx("h-5 w-5 transition-transform", overallOpen ? "-rotate-90" : "rotate-180")} />
        </summary>
        <div className="border-t p-4">
          <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
            <DesktopTable 
              rows={rows} 
              date={date} 
              canManage={canManage} 
              currentUser={currentUser} 
              linkedPlayerIds={linkedPlayerIds}
              handleCellChange={handleCellChange}
              getRowBgColor={getRowBgColor}
              t={t}
            />
          </div>
        </div>
      </details>
      <SessionSettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        form={formQuery.data} 
        date={date}
      />
    </div>
  );
}

function DesktopTable({ rows, date, canManage, currentUser, linkedPlayerIds, handleCellChange, getRowBgColor, t }: DesktopTableProps) {
  const [sortColumn, setSortColumn] = useState<'student_id' | 'name' | 'type' | 'attend' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: 'student_id' | 'name' | 'type' | 'attend') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;
    return [...rows].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      if (sortColumn === 'student_id') {
        valA = a.player.student_id || '';
        valB = b.player.student_id || '';
      } else if (sortColumn === 'name') {
        valA = a.player.display_name || '';
        valB = b.player.display_name || '';
      } else if (sortColumn === 'type') {
        valA = a.enrollment_type || '';
        valB = b.enrollment_type || '';
      } else if (sortColumn === 'attend') {
        valA = a.date_records[date] ?? 0;
        valB = b.date_records[date] ?? 0;
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortColumn, sortDirection, date]);

  const renderSortableHeader = (column: 'student_id' | 'name' | 'type' | 'attend', label: string, className: string) => (
    <th 
      className={clsx(className, "cursor-pointer hover:bg-muted/80 transition-colors select-none")}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={clsx("h-3 w-3", sortColumn === column ? "text-primary font-bold" : "text-muted-foreground")} />
      </div>
    </th>
  );

  return (
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-muted text-muted-foreground">
        <tr>
          {renderSortableHeader('student_id', t('enrollments:detail.table.studentId'), "px-4 py-3 font-medium border-b border-r sticky left-0 z-20 bg-muted")}
          {renderSortableHeader('name', t('enrollments:detail.table.name'), "px-4 py-3 font-medium border-b border-r sticky left-[80px] z-20 bg-muted min-w-[120px]")}
          {renderSortableHeader('type', t('enrollments:detail.table.type'), "px-4 py-3 font-medium border-b border-r min-w-[120px]")}
          {renderSortableHeader('attend', '報名 (1/0)', "px-4 py-3 font-medium border-b border-r min-w-[80px] text-center justify-center")}
          <th className="px-4 py-3 font-medium border-b border-r min-w-[160px] bg-blue-50/50 text-blue-800">{t('enrollments:detail.table.dailyNote')}</th>
          <th className="px-4 py-3 font-medium border-b min-w-[200px] bg-blue-50/50 text-blue-800">{t('enrollments:detail.table.dailyInfo')}</th>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => {
          const canEditInfo = canManage || currentUser?.id === row.player.id || linkedPlayerIds.has(row.player.id);
          
          return (
            <tr key={row.id} className={clsx("border-b last:border-b-0 hover:bg-muted/50 transition-colors", getRowBgColor(row.enrollment_type))}>
              <td className={clsx("px-4 py-2 border-r sticky left-0 z-10", getRowBgColor(row.enrollment_type))}>
                {row.player.student_id || '-'}
              </td>
              <td className={clsx("px-4 py-2 border-r sticky left-[80px] z-10", getRowBgColor(row.enrollment_type))}>
                <div className="flex flex-col">
                  <span className="font-medium">{row.player.display_name}</span>
                  <span className="text-[10px] text-muted-foreground">@{row.player.username}</span>
                </div>
              </td>
              <td className="px-2 py-2 border-r">
                <select
                  disabled={!canManage}
                  value={row.enrollment_type || ''}
                  onChange={(e) => handleCellChange(row.id, 'enrollment_type', e.target.value, row)}
                  className="w-full bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px] md:h-auto"
                >
                  <option value="">--</option>
                  <option value="season">{t('enrollments:detail.table.types.season')}</option>
                  <option value="pre_single">{t('enrollments:detail.table.types.pre_single')}</option>
                  <option value="single">{t('enrollments:detail.table.types.single')}</option>
                  <option value="skip">{t('enrollments:detail.table.types.skip')}</option>
                </select>
              </td>
              <td className="px-2 py-2 border-r text-center">
                <select
                  disabled={!canManage}
                  value={row.date_records[date] ?? ''}
                  onChange={(e) => handleCellChange(row.id, 'date_records', e.target.value ? Number(e.target.value) : '', row)}
                  className="w-16 md:w-12 mx-auto bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-center text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px] md:h-auto"
                >
                  <option value=""></option>
                  <option value="1">1</option>
                  <option value="0">0</option>
                </select>
              </td>
              <td className="px-2 py-2 border-r bg-blue-50/20">
                <select
                  disabled={!canEditInfo}
                  value={row.daily_status[date] || 'no_change'}
                  onChange={(e) => handleCellChange(row.id, 'daily_status', e.target.value, row)}
                  className="w-full bg-background/50 border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px] md:h-auto"
                >
                  <option value="no_change">{t('enrollments:detail.table.dailyNotes.no_change')}</option>
                  <option value="need_single">{t('enrollments:detail.table.dailyNotes.need_single')}</option>
                  <option value="leave_early">{t('enrollments:detail.table.dailyNotes.leave_early')}</option>
                  <option value="leave_of_absence">{t('enrollments:detail.table.dailyNotes.leave_of_absence')}</option>
                </select>
              </td>
              <td className="px-2 py-2 bg-blue-50/20">
                <input
                  disabled={!canEditInfo}
                  type="text"
                  value={row.daily_info[date] || ''}
                  onChange={(e) => handleCellChange(row.id, 'daily_info', e.target.value, row)}
                  placeholder="自由填寫..."
                  className="w-full bg-background/50 border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px] md:h-auto"
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
