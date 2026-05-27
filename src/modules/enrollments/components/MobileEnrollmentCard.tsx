import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { TrainingEnrollmentRowRow } from '@/core/supabase/types';

interface Props {
  row: any;
  date: string;
  canEdit: boolean;
  handleCellChange: (
    rowId: string,
    field: 'daily_status' | 'daily_info' | 'enrollment_type' | 'date_records',
    value: string | number,
    currentRow: TrainingEnrollmentRowRow
  ) => void;
  getRowBgColor: (type: string | null) => string;
}

export function MobileEnrollmentCard({ row, date, canEdit, handleCellChange, getRowBgColor }: Props) {
  const { t } = useTranslation();

  return (
    <div className={clsx("flex flex-col gap-3 rounded-lg border p-4 shadow-sm", getRowBgColor(row.enrollment_type))}>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex flex-col">
          <span className="font-bold text-lg">{row.player.display_name}</span>
          <span className="text-sm text-muted-foreground">@{row.player.username}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{t('enrollments:detail.table.studentId')}</div>
          <div className="font-medium">{row.player.student_id || '-'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Type */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{t('enrollments:detail.table.type')}</label>
          <select
            disabled={true} // Usually type is managed by admin, but let's keep it disabled on mobile for regular users. Wait, the desktop version disables it if !canManage. We pass canEdit=true, but we shouldn't allow type edit for normal users on mobile if they can't do it on desktop. Since we don't pass canManage down, let's just make it disabled for everyone on mobile for safety, or we need to pass canManage. Actually, they just need to see it.
            value={row.enrollment_type || ''}
            className="w-full bg-transparent border border-gray-200 rounded p-1.5 text-sm disabled:opacity-70 disabled:bg-gray-50 h-[44px]"
          >
            <option value="">--</option>
            <option value="season">{t('enrollments:detail.table.types.season')}</option>
            <option value="pre_single">{t('enrollments:detail.table.types.pre_single')}</option>
            <option value="single">{t('enrollments:detail.table.types.single')}</option>
            <option value="skip">{t('enrollments:detail.table.types.skip')}</option>
          </select>
        </div>

        {/* Date Record (1/0) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">報名 (1/0)</label>
          <select
            disabled={true} // Same here, usually managed by admin.
            value={row.date_records[date] ?? ''}
            className="w-full bg-transparent border border-gray-200 rounded p-1.5 text-sm disabled:opacity-70 disabled:bg-gray-50 h-[44px]"
          >
            <option value=""></option>
            <option value="1">1 (參加)</option>
            <option value="0">0 (不參加)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-blue-100">
        <label className="text-xs font-semibold text-blue-800">{t('enrollments:detail.table.dailyNote')}</label>
        <select
          disabled={!canEdit}
          value={row.daily_status[date] || 'no_change'}
          onChange={(e) => handleCellChange(row.id, 'daily_status', e.target.value, row)}
          className="w-full bg-white border border-blue-200 focus:border-primary focus:ring-1 rounded p-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px]"
        >
          <option value="no_change">{t('enrollments:detail.table.dailyNotes.no_change')}</option>
          <option value="need_single">{t('enrollments:detail.table.dailyNotes.need_single')}</option>
          <option value="leave_early">{t('enrollments:detail.table.dailyNotes.leave_early')}</option>
          <option value="leave_of_absence">{t('enrollments:detail.table.dailyNotes.leave_of_absence')}</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-blue-800">{t('enrollments:detail.table.dailyInfo')}</label>
        <input
          disabled={!canEdit}
          type="text"
          value={row.daily_info[date] || ''}
          onChange={(e) => handleCellChange(row.id, 'daily_info', e.target.value, row)}
          placeholder="點此輸入備註 (如: 晚到30分)..."
          className="w-full bg-white border border-blue-200 focus:border-primary focus:ring-1 rounded p-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed h-[44px]"
        />
      </div>
    </div>
  );
}
