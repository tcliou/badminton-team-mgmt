import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Settings } from 'lucide-react';
import { useEnrollmentForm, useEnrollmentRows, useAddRow, useDeleteRow } from '../api/enrollmentsApi';
import { useActivePlayers } from '@/modules/players/api/playersApi';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { EnrollmentSpreadsheet } from '../components/EnrollmentSpreadsheet';
import { EnrollmentFormDialog } from '../components/EnrollmentFormDialog';

export function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const formQuery = useEnrollmentForm(id!);
  const rowsQuery = useEnrollmentRows(id!);
  const playersQuery = useActivePlayers();
  
  const addRow = useAddRow(id!);
  const deleteRow = useDeleteRow();
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes(PERMISSIONS.ActionTrainingManage) ?? false;

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [editOpen, setEditOpen] = useState(false);

  const datesToDisplay = useMemo(() => {
    if (!formQuery.data?.dates) return [];
    let dates = [...formQuery.data.dates].sort();
    if (dateRange.start) dates = dates.filter(d => d >= dateRange.start);
    if (dateRange.end) dates = dates.filter(d => d <= dateRange.end);
    return dates;
  }, [formQuery.data?.dates, dateRange]);

  const handleAddPlayer = async (playerId: string) => {
    if (!playerId) return;
    await addRow.mutateAsync(playerId);
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm(t('enrollments:detail.table.deleteRowConfirm'))) return;
    await deleteRow.mutateAsync(rowId);
  };

  if (formQuery.isLoading || rowsQuery.isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}...</div>;
  }

  if (!formQuery.data) return null;

  // Filter players not already in the form
  const existingPlayerIds = new Set(rowsQuery.data?.map(r => r.player_id) || []);
  const availablePlayers = playersQuery.data?.filter(p => !existingPlayerIds.has(p.id)) || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/enrollments')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{formQuery.data.title}</h1>
        </div>
        {canManage && (
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <Settings className="h-4 w-4" />
            {t('enrollments:detail.settings')}
          </Button>
        )}
      </header>

      {formQuery.data.description && (
        <div className="rounded-xl border bg-muted/50 p-4 shadow-sm text-sm whitespace-pre-wrap text-muted-foreground">
          <h3 className="font-semibold mb-2 text-primary">{t('enrollments:detail.announcement')}</h3>
          {formQuery.data.description}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t('enrollments:detail.filter.start')}</label>
          <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t('enrollments:detail.filter.end')}</label>
          <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} />
        </div>
        <Button variant="ghost" onClick={() => setDateRange({start: '', end: ''})}>
          {t('enrollments:detail.filter.clear')}
        </Button>
      </div>

      <EnrollmentSpreadsheet
        rows={rowsQuery.data || []}
        dates={datesToDisplay}
        onDeleteRow={handleDeleteRow}
      />

      {canManage && (
        <div className="flex items-center gap-2 pt-4">
          <select 
            className="flex h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              if (e.target.value) {
                handleAddPlayer(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="">{t('enrollments:detail.table.selectPlayer')}...</option>
            {availablePlayers.map(p => (
              <option key={p.id} value={p.id}>
                {p.student_id ? `[${p.student_id}] ` : ''}{p.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <EnrollmentFormDialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        form={formQuery.data} 
      />
    </div>
  );
}
