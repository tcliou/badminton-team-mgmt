import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useIssues, useDeleteIssue } from '../api/issuesApi';
import { IssueForm } from '../components/IssueForm';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import type { IssueRow } from '@/core/supabase/types';
import { cn } from '@/shared/utils/cn';

export default function IssuesPage() {
  const { t } = useTranslation(['issues', 'common']);
  const { data, isLoading } = useIssues();
  const deleteMut = useDeleteIssue();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IssueRow | null>(null);

  const handleEdit = (issue: IssueRow) => {
    setEditing(issue);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('issues:confirmDelete'))) {
      try {
        await deleteMut.mutateAsync(id);
      } catch (err) {
        console.error(err);
        alert(t('common:error'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('issues:title')}</h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('issues:add')}
        </Button>
      </header>

      {isLoading ? (
        <Loading />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('issues:empty')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((issue) => (
            <div key={issue.id} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg line-clamp-2">{issue.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(issue as any)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(issue.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {issue.description || '—'}
              </p>
              <div className="mt-auto pt-3 border-t flex flex-wrap gap-2 text-xs">
                <span className={cn("px-2 py-1 rounded-md", 
                  issue.status === 'open' ? "bg-blue-100 text-blue-800" :
                  issue.status === 'in_progress' ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                )}>
                  {t(`issues:status.${issue.status}`)}
                </span>
                <span className={cn("px-2 py-1 rounded-md",
                  issue.priority === 'high' ? "bg-rose-100 text-rose-800" :
                  issue.priority === 'medium' ? "bg-orange-100 text-orange-800" :
                  "bg-slate-100 text-slate-800"
                )}>
                  {t(`issues:priority.${issue.priority}`)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between mt-1">
                <span>{t('issues:fields.assignedTo')}: {(issue as any).assignee?.display_name || '—'}</span>
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <IssueForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
    </div>
  );
}
