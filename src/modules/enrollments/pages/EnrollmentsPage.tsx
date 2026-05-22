import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEnrollmentForms } from '../api/enrollmentsApi';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { EnrollmentFormDialog } from '../components/EnrollmentFormDialog';
function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString();
}

export function EnrollmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const forms = useEnrollmentForms();
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes(PERMISSIONS.ActionTrainingManage) ?? false;

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('enrollments:title')}</h1>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('enrollments:list.create')}
          </Button>
        )}
      </header>

      {forms.isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}...</div>
      ) : forms.data?.length === 0 ? (
        <EmptyState
          title={t('enrollments:list.empty')}
          description="建立團練報名表，讓球員可以登記各個日期的出席狀況"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {forms.data?.map((form) => (
            <div key={form.id} className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
              <div 
                className="flex cursor-pointer flex-col p-4 transition-colors hover:bg-muted/50 border-l-4 border-l-primary"
                onClick={() => navigate(`/enrollments/${form.id}`)}
              >
                <h3 className="font-semibold text-card-foreground">{form.title}</h3>
                <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>日期：{form.dates.length} 個時段</span>
                  <span>狀態：{t(`enrollments:list.status.${form.status}`)}</span>
                  <span>建立於：{formatDateTime(form.created_at)}</span>
                </div>
              </div>
              
              {form.generate_sessions && form.dates.length > 0 && (
                <div className="flex flex-col border-t bg-muted/20 pl-8 pr-4 py-2">
                  {form.dates.map((date) => (
                    <div 
                      key={date}
                      className="flex cursor-pointer items-center py-2 text-sm text-muted-foreground hover:text-primary transition-colors border-l-2 border-l-transparent hover:border-l-primary pl-3 ml-2"
                      onClick={() => navigate(`/enrollments/${form.id}/sessions/${date}`)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mr-3"></div>
                      {date} 場次
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EnrollmentFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
