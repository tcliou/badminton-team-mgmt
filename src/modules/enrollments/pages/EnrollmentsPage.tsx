import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEnrollmentForms } from '../api/enrollmentsApi';
import { useAuthStore } from '@/core/store/authStore';
import { PERMISSIONS } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { CreateEnrollmentFormDialog } from '../components/CreateEnrollmentFormDialog';
export function formatDateTime(dateString: string): string {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.data?.map((form) => (
            <div
              key={form.id}
              className="flex cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/enrollments/${form.id}`)}
            >
              <h3 className="font-semibold text-card-foreground">{form.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>日期：{form.dates.length} 個時段</p>
                <p>狀態：{t(`enrollments:list.status.${form.status}`)}</p>
                <p>建立於：{formatDateTime(form.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEnrollmentFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
