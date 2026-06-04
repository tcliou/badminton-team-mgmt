import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateRow, type EnrollmentRowWithPlayer } from '../api/enrollmentsApi';
import type { TrainingEnrollmentRowRow } from '@/core/supabase/types';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { Trash2, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { isBefore, startOfDay, parseISO } from 'date-fns';

interface Props {
  rows: EnrollmentRowWithPlayer[];
  dates: string[];
  onDeleteRow: (rowId: string) => void;
}

export function EnrollmentSpreadsheet({ rows, dates, onDeleteRow }: Props) {
  const { t } = useTranslation();
  const updateRow = useUpdateRow();
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes(PERMISSIONS.ActionTrainingManage) ?? false;

  const [localRows, setLocalRows] = useState<EnrollmentRowWithPlayer[]>(rows);
  const [sortColumn, setSortColumn] = useState<'student_id' | 'name' | 'type' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const today = startOfDay(new Date());

  const handleSort = (column: 'student_id' | 'name' | 'type') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortColumn) return localRows;
    return [...localRows].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortColumn === 'student_id') {
        valA = a.player.student_id || '';
        valB = b.player.student_id || '';
      } else if (sortColumn === 'name') {
        valA = a.player.display_name || '';
        valB = b.player.display_name || '';
      } else if (sortColumn === 'type') {
        valA = a.enrollment_type || '';
        valB = b.enrollment_type || '';
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [localRows, sortColumn, sortDirection]);

  const canEditRow = (playerId: string) => {
    if (canManage) return true;
    if (currentUser?.id === playerId) return true;
    return canManage || currentUser?.id === playerId; 
  };

  const isDateLocked = (dateStr: string) => {
    if (canManage) return false;
    const date = startOfDay(parseISO(dateStr));
    return isBefore(date, today);
  };

  const handleCellChange = (
    rowId: string,
    field: keyof EnrollmentRowWithPlayer | 'date',
    value: string | number,
    dateKey?: string,
  ) => {
    const allowedFields = ['player', 'enrollment_type', 'date', 'note'];
    if (!allowedFields.includes(field)) return;

    let safeDate = '';
    if (dateKey) {
      const match = dateKey.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (!match) return; // Drop invalid date injections
      safeDate = match[1] as string;
    }

    setLocalRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if (field === 'date' && safeDate) {
          const map = new Map(Object.entries(r.date_records || {}));
          map.set(safeDate, value as number);
          return { ...r, date_records: Object.fromEntries(map) };
        }
        return { ...r, [field]: value };
      }),
    );

    // Debounce or immediate update
    const patch: Partial<TrainingEnrollmentRowRow> = {};
    if (field === 'date' && safeDate) {
      const row = localRows.find((r) => r.id === rowId);
      const map = new Map(Object.entries(row?.date_records || {}));
      map.set(safeDate, value as number);
      patch.date_records = Object.fromEntries(map);
    } else if (field !== 'date' && field !== 'player') {
      if (field === 'enrollment_type') patch.enrollment_type = value as string;
      if (field === 'note') patch.note = value as string;
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

  const dateTotals = dates.reduce((acc, d) => {
    acc[d] = localRows.reduce((sum, r) => {
      if (r.date_records[d] === 1 || r.daily_status[d] === 'need_single') return sum + 1;
      if (r.date_records[d] === 0 || r.daily_status[d] === 'leave_of_absence') return sum;
      if (r.enrollment_type === 'season') return sum + 1;
      return sum;
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const renderSortableHeader = (column: 'student_id' | 'name' | 'type', label: string, className: string) => (
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
    <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {renderSortableHeader('student_id', t('enrollments:detail.table.studentId'), "px-4 py-3 font-medium border-b border-r sticky left-0 z-20 bg-muted")}
            {renderSortableHeader('name', t('enrollments:detail.table.name'), "px-4 py-3 font-medium border-b border-r sticky left-[80px] z-20 bg-muted min-w-[120px]")}
            {renderSortableHeader('type', t('enrollments:detail.table.type'), "px-4 py-3 font-medium border-b border-r min-w-[140px]")}
            {dates.map((d) => (
              <th key={d} className="px-4 py-3 font-medium border-b border-r text-center">{d}</th>
            ))}
            <th className="px-4 py-3 font-medium border-b min-w-[200px]">{t('enrollments:detail.table.note')}</th>
            {canManage && <th className="px-4 py-3 font-medium border-b w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const canEdit = canEditRow(row.player.id);
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
                    disabled={!canEdit}
                    value={row.enrollment_type || ''}
                    onChange={(e) => handleCellChange(row.id, 'enrollment_type', e.target.value)}
                    className="w-full bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">--</option>
                    <option value="season">{t('enrollments:detail.table.types.season')}</option>
                    <option value="pre_single">{t('enrollments:detail.table.types.pre_single')}</option>
                    <option value="single">{t('enrollments:detail.table.types.single')}</option>
                    <option value="skip">{t('enrollments:detail.table.types.skip')}</option>
                  </select>
                </td>
                {dates.map((d) => {
                  const locked = isDateLocked(d);
                  return (
                    <td key={d} className="px-2 py-2 border-r text-center">
                      <select
                        disabled={!canEdit || locked}
                        value={row.date_records[d] ?? ''}
                        onChange={(e) => handleCellChange(row.id, 'date', e.target.value ? Number(e.target.value) : '', d)}
                        className={clsx(
                          "w-12 mx-auto bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-center text-sm disabled:cursor-not-allowed",
                          locked ? "opacity-50" : ""
                        )}
                        title={locked ? "過去日期已鎖定" : undefined}
                      >
                        <option value=""></option>
                        <option value="1">1</option>
                        <option value="0">0</option>
                      </select>
                    </td>
                  );
                })}
                <td className="px-2 py-2 border-r">
                  <input
                    disabled={!canEdit}
                    type="text"
                    value={row.note || ''}
                    onChange={(e) => handleCellChange(row.id, 'note', e.target.value)}
                    className="w-full bg-transparent border border-transparent focus:border-primary focus:ring-1 rounded p-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </td>
                {canManage && (
                  <td className="px-2 py-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => onDeleteRow(row.id)} className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-muted font-medium">
          <tr>
            <td colSpan={3} className="px-4 py-3 text-right sticky left-0 z-20 bg-muted border-t border-r">{t('enrollments:detail.table.total')}</td>
            {dates.map((d) => (
              <td key={d} className="px-4 py-3 text-center border-t border-r text-primary">{dateTotals[d]}</td>
            ))}
            <td className="px-4 py-3 border-t"></td>
            {canManage && <td className="px-4 py-3 border-t"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
