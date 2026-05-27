import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, LayoutGrid, List as ListIcon, Link as LinkIcon, Filter, ArrowDownWideNarrow, Group } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEpic, setFilterEpic] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'epic'>('epic');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const epics = data?.filter(i => i.issue_type === 'epic') || [];
  const assignees = Array.from(
    new Map(
      (data || [])
        .filter((i) => (i as any).assignee_id && (i as any).assignee)
        .map((i) => [(i as any).assignee_id, (i as any).assignee])
    ).values()
  ) as { id: string; display_name: string }[];

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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{t('issues:title')}</h1>
          <div className="flex border rounded-md overflow-hidden bg-background">
            <button
              className={cn("px-3 py-1.5 text-sm", viewMode === 'grid' ? "bg-muted" : "hover:bg-muted/50")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              className={cn("px-3 py-1.5 text-sm", viewMode === 'list' ? "bg-muted" : "hover:bg-muted/50")}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
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
        <>
          <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-card">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select className="border rounded px-2 py-1 text-sm bg-background" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="open">{t('issues:status.open')}</option>
                <option value="in_progress">{t('issues:status.in_progress')}</option>
                <option value="resolved">{t('issues:status.resolved')}</option>
                <option value="closed">{t('issues:status.closed')}</option>
              </select>
              <select className="border rounded px-2 py-1 text-sm bg-background" value={filterEpic} onChange={e => setFilterEpic(e.target.value)}>
                <option value="all">All Epics</option>
                <option value="Epic">Epic</option>
                <option value="none">No Epic</option>
                {epics.map(epic => (
                  <option key={epic.id} value={epic.id}>{epic.title}</option>
                ))}
              </select>
              <select className="border rounded px-2 py-1 text-sm bg-background" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map(a => (
                  <option key={a.id} value={a.id}>{a.display_name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Group className="w-4 h-4 text-muted-foreground" />
              <select className="border rounded px-2 py-1 text-sm bg-background" value={groupBy} onChange={e => setGroupBy(e.target.value as 'none' | 'status' | 'epic')}>
                <option value="none">No Grouping</option>
                <option value="status">Group by Status</option>
                <option value="epic">Group by Epic</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowDownWideNarrow className="w-4 h-4 text-muted-foreground" />
              <select className="border rounded px-2 py-1 text-sm bg-background" value={sortBy} onChange={e => setSortBy(e.target.value as 'created_at' | 'priority' | 'status')}>
                <option value="created_at">Sort by Created Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
              <select className="border rounded px-2 py-1 text-sm bg-background" value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          {(() => {
            let processed = [...data];
            if (filterStatus !== 'all') processed = processed.filter(i => i.status === filterStatus);
            if (filterEpic !== 'all') {
              processed = processed.filter(i => {
                if (filterEpic === 'none') return !i.parent_id && i.issue_type !== 'epic';
                if (filterEpic === 'Epic') return i.issue_type === 'epic';
                return i.parent_id === filterEpic;
              });
            }
            if (filterAssignee !== 'all') {
              processed = processed.filter(i => filterAssignee === 'unassigned' ? !(i as any).assignee_id : (i as any).assignee_id === filterAssignee);
            }

            processed.sort((a, b) => {
              let cmp = 0;
              if (sortBy === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              else if (sortBy === 'priority') {
                const p = { high: 3, medium: 2, low: 1 };
                cmp = (p[a.priority] || 0) - (p[b.priority] || 0);
              } else if (sortBy === 'status') {
                const s = { open: 1, in_progress: 2, resolved: 3, closed: 4 };
                cmp = (s[a.status] || 0) - (s[b.status] || 0);
              }
              return sortOrder === 'desc' ? -cmp : cmp;
            });

            const renderIssues = (issues: IssueRow[]) => (
              <div className={cn("grid gap-4", viewMode === 'grid' ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                {issues.map((issue) => (
            <div key={issue.id} className={cn("rounded-xl border bg-card p-4 shadow-sm flex", viewMode === 'grid' ? "flex-col gap-3" : "flex-row items-center gap-4")}>
              <div className={cn("flex-1 flex", viewMode === 'grid' ? "flex-col gap-2" : "flex-row items-center gap-4")}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {issue.issue_type === 'epic' && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">Epic</span>}
                    {issue.issue_type === 'bug' && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">Bug</span>}
                    {issue.issue_type === 'task' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">Task</span>}
                    <h3 className="font-semibold text-lg line-clamp-2">{issue.title}</h3>
                  </div>
                  {viewMode === 'grid' && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(issue as unknown as IssueRow)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(issue.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {(issue as unknown as { parent?: { title?: string } }).parent && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    {(issue as unknown as { parent?: { title?: string } }).parent?.title}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {issue.description || '—'}
                  </p>
                )}

                <div className={cn("flex flex-wrap gap-2 text-xs", viewMode === 'grid' ? "mt-auto pt-3 border-t" : "")}>
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
                  {issue.tags && issue.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={cn("text-xs text-muted-foreground flex", viewMode === 'grid' ? "justify-between mt-1" : "flex-col items-end gap-1 ml-4 min-w-[120px]")}>
                <span>{t('issues:fields.assignedTo')}: {(issue as unknown as { assignee?: { display_name?: string | null } }).assignee?.display_name || '—'}</span>
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>

              {viewMode === 'list' && (
                <div className="flex gap-1 shrink-0 ml-4 border-l pl-4">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(issue as unknown as IssueRow)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(issue.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      );

      if (groupBy === 'none') {
        return renderIssues(processed);
      }

      const groups = new Map<string, IssueRow[]>();
      processed.forEach(issue => {
        let key = '';
        if (groupBy === 'status') key = issue.status;
        if (groupBy === 'epic') {
          key = issue.issue_type === 'epic' ? 'Epic' : ((issue as unknown as { parent?: { title?: string } }).parent?.title || 'No Epic');
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(issue);
      });

      return (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([key, issues]) => (
            <div key={key} className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2">
                {groupBy === 'status' ? t(`issues:status.${key}`) : key} <span className="text-muted-foreground text-sm font-normal">({issues.length})</span>
              </h2>
              {renderIssues(issues)}
            </div>
          ))}
        </div>
      );
    })()}
  </>
)}

      <IssueForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        allIssues={data as unknown as IssueRow[]}
      />
    </div>
  );
}
