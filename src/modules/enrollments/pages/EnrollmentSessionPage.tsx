import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useEnrollmentForm, useEnrollmentRows, useUpdateRow } from '../api/enrollmentsApi';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { Settings } from 'lucide-react';
import type { TrainingEnrollmentRowRow } from '@/core/supabase/types';
import { SessionSettingsDialog } from '../components/SessionSettingsDialog';
import { defaultSessionDetails } from '../constants';
import { useState } from 'react';

export function EnrollmentSessionPage() {
  const { id, date } = useParams<{ id: string; date: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const formQuery = useEnrollmentForm(id!);
  const rowsQuery = useEnrollmentRows(id!);
  const updateRow = useUpdateRow();
  
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes(PERMISSIONS.ActionTrainingManage) ?? false;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCellChange = (
    rowId: string,
    field: 'daily_status' | 'daily_info' | 'enrollment_type' | 'date_records',
    value: string | number,
    currentRow: TrainingEnrollmentRowRow
  ) => {
    const patch: Partial<TrainingEnrollmentRowRow> = {};
    if (field === 'daily_status') {
      patch.daily_status = { ...currentRow.daily_status, [date!]: value as string };
    } else if (field === 'daily_info') {
      patch.daily_info = { ...currentRow.daily_info, [date!]: value as string };
    } else if (field === 'date_records') {
      patch.date_records = { ...currentRow.date_records, [date!]: value as number };
    } else {
      (patch as Record<string, unknown>)[field] = value;
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
  
  const totalPlayers = rows.filter(r => r.date_records[date] === 1 || r.daily_status[date] === 'need_single').length;
  const sessionDetails = formQuery.data.session_details?.[date] || defaultSessionDetails;

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

      <div className="rounded-xl border bg-muted/50 p-4 shadow-sm text-sm text-muted-foreground space-y-2">
        <h3 className="font-semibold mb-2 text-primary">個別場次公告事項：</h3>
        <p>● {t('enrollments:detail.sessionDetails.time')}： {sessionDetails.time}</p>
        <p>● {t('enrollments:detail.sessionDetails.location')}： {sessionDetails.location}</p>
        <p>● {t('enrollments:detail.sessionDetails.items')}： {sessionDetails.items}</p>
        <div className="flex">
          <span className="whitespace-nowrap">● {t('enrollments:detail.sessionDetails.notes')}： </span>
          <span>{sessionDetails.notes}</span>
        </div>
        <p>● {t('enrollments:detail.sessionDetails.equipment')}： {sessionDetails.equipment}</p>
        <p>● {t('enrollments:detail.sessionDetails.fee')}： {sessionDetails.fee}</p>
        <p>● {t('enrollments:detail.sessionDetails.coaches')}： {sessionDetails.coaches}</p>
        <p className="font-bold text-primary">● {t('enrollments:detail.sessionDetails.totalPlayers')}： {totalPlayers} 名</p>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium border-b border-r sticky left-0 z-20 bg-muted">{t('enrollments:detail.table.studentId')}</th>
              <th className="px-4 py-3 font-medium border-b border-r sticky left-[80px] z-20 bg-muted min-w-[120px]">{t('enrollments:detail.table.name')}</th>
              <th className="px-4 py-3 font-medium border-b border-r min-w-[120px]">{t('enrollments:detail.table.type')}</th>
              <th className="px-4 py-3 font-medium border-b border-r min-w-[80px] text-center">報名 (1/0)</th>
              <th className="px-4 py-3 font-medium border-b border-r min-w-[160px] bg-blue-50/50 text-blue-800">{t('enrollments:detail.table.dailyNote')}</th>
              <th className="px-4 py-3 font-medium border-b min-w-[200px] bg-blue-50/50 text-blue-800">{t('enrollments:detail.table.dailyInfo')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const canEditInfo = canManage || currentUser?.id === row.player.id;
              
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
                      className="w-full bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                      className="w-12 mx-auto bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-center text-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                      className="w-full bg-background/50 border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                      className="w-full bg-background/50 border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SessionSettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        form={formQuery.data} 
        date={date}
      />
    </div>
  );
}
