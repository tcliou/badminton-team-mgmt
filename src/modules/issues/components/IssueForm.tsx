import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActiveProfiles } from '@/modules/finance/api/transactionsApi'; // Reuse hook
import { useCreateIssue, useUpdateIssue } from '../api/issuesApi';
import type { IssueRow, IssueStatus, IssuePriority } from '@/core/supabase/types';
import { Button } from '@/shared/components/Button';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high']),
  assigned_to: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing: IssueRow | null;
}

export function IssueForm({ open, onClose, editing }: Props) {
  const { t } = useTranslation(['issues', 'common']);
  const createMut = useCreateIssue();
  const updateMut = useUpdateIssue();
  const { data: profiles } = useActiveProfiles();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigned_to: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          title: editing.title,
          description: editing.description || '',
          status: editing.status,
          priority: editing.priority,
          assigned_to: editing.assigned_to || '',
        });
      } else {
        reset({
          title: '',
          description: '',
          status: 'open',
          priority: 'medium',
          assigned_to: '',
        });
      }
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        assigned_to: data.assigned_to || null,
      };

      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(t('common:error'));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4 rounded-xl border bg-card p-5 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-4">
          {editing ? t('issues:edit') : t('issues:add')}
        </h3>
        
        <div>
          <label className="mb-1 block text-sm font-medium">{t('issues:fields.title')}</label>
          <input
            {...register('title')}
            className="w-full rounded-md border p-2 text-sm"
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('issues:fields.description')}</label>
          <textarea
            {...register('description')}
            className="w-full rounded-md border p-2 h-24 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('issues:fields.status')}</label>
            <select {...register('status')} className="w-full rounded-md border p-2 text-sm">
              <option value="open">{t('issues:status.open')}</option>
              <option value="in_progress">{t('issues:status.in_progress')}</option>
              <option value="resolved">{t('issues:status.resolved')}</option>
              <option value="closed">{t('issues:status.closed')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('issues:fields.priority')}</label>
            <select {...register('priority')} className="w-full rounded-md border p-2 text-sm">
              <option value="low">{t('issues:priority.low')}</option>
              <option value="medium">{t('issues:priority.medium')}</option>
              <option value="high">{t('issues:priority.high')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('issues:fields.assignedTo')}</label>
          <select {...register('assigned_to')} className="w-full rounded-md border p-2 text-sm">
            <option value="">--</option>
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common:cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {t('common:save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
