import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pin, Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { fromDateTimeInputValue, toDateTimeInputValue } from '@/shared/utils/dates';
import {
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '../api/announcementsApi';
import { useAllRoles } from '../api/rolesApi';
import { MarkdownPreview } from './MarkdownPreview';
import type { AnnouncementRow, AnnouncementStatus } from '@/core/supabase/types';

const schema = z.object({
  title: z.string().min(1),
  body_md: z.string().default(''),
  is_pinned: z.boolean().default(false),
  publishMode: z.enum(['draft', 'now', 'scheduled']),
  publish_at_input: z.string().optional(),
  visible_to_role_ids: z.array(z.string()).default([]),
});
type FormData = z.infer<typeof schema>;

function rowToFormValues(row: AnnouncementRow | null): FormData {
  return {
    title: row?.title ?? '',
    body_md: row?.body_md ?? '',
    is_pinned: row?.is_pinned ?? false,
    publishMode:
      row?.status === 'published'
        ? 'now'
        : row?.status === 'scheduled'
          ? 'scheduled'
          : 'draft',
    publish_at_input: row?.publish_at ? toDateTimeInputValue(row.publish_at) : '',
    visible_to_role_ids: row?.visible_to_role_ids ?? [],
  };
}

interface Props {
  /** 不傳代表新增；傳則編輯 */
  editing?: AnnouncementRow | null;
  onDone?: () => void;
}

export function AnnouncementForm({ editing, onDone }: Props) {
  const { t } = useTranslation();
  const roles = useAllRoles();
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const del = useDeleteAnnouncement();
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const {
    register,
    watch,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: rowToFormValues(editing ?? null),
  });

  const publishMode = watch('publishMode');
  const body = watch('body_md');

  const onSubmit = async (data: FormData) => {
    let status: AnnouncementStatus;
    let publish_at: string | null;
    if (data.publishMode === 'draft') {
      status = 'draft';
      publish_at = null;
    } else if (data.publishMode === 'scheduled') {
      status = 'scheduled';
      publish_at = data.publish_at_input ? fromDateTimeInputValue(data.publish_at_input) : null;
    } else {
      status = 'published';
      publish_at = new Date().toISOString();
    }

    const payload = {
      title: data.title,
      body_md: data.body_md ?? '',
      is_pinned: data.is_pinned,
      status,
      publish_at,
      visible_to_role_ids: data.visible_to_role_ids ?? [],
    };

    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onDone?.();
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm(t('announcements:form.deleteConfirm'))) return;
    await del.mutateAsync(editing.id);
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">
        {editing ? t('announcements:form.edit') : t('announcements:form.new')}
      </h2>

      <div className="space-y-1">
        <label className="text-xs font-medium">{t('announcements:form.titleField')}</label>
        <Input {...register('title')} aria-invalid={Boolean(errors.title)} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{t('announcements:form.body')}</label>
          <div className="flex gap-1 rounded-md border bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`rounded px-2 py-0.5 ${
                tab === 'write' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('announcements:form.writeMode')}
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`rounded px-2 py-0.5 ${
                tab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('announcements:form.previewMode')}
            </button>
          </div>
        </div>
        {tab === 'write' ? (
          <textarea
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="# 標題&#10;&#10;內文支援 **粗體**、列表、連結等 Markdown 語法"
            {...register('body_md')}
          />
        ) : (
          <div className="min-h-[200px] rounded-md border bg-background p-3">
            <MarkdownPreview body={body || '_（沒有內容）_'} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_pinned')} className="accent-primary" />
          <Pin className="h-3.5 w-3.5" aria-hidden />
          {t('announcements:form.isPinned')}
        </label>
      </div>

      <fieldset className="space-y-1.5 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium">{t('announcements:form.publishMode')}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="draft" {...register('publishMode')} className="accent-primary" />
          {t('announcements:form.publishDraft')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="now" {...register('publishMode')} className="accent-primary" />
          {t('announcements:form.publishNow')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            value="scheduled"
            {...register('publishMode')}
            className="accent-primary"
          />
          {t('announcements:form.publishScheduled')}
        </label>
        {publishMode === 'scheduled' ? (
          <div className="ml-6 mt-2 space-y-1">
            <label className="text-xs font-medium">{t('announcements:form.publishAt')}</label>
            <Input type="datetime-local" {...register('publish_at_input')} />
          </div>
        ) : null}
      </fieldset>

      <div className="space-y-1">
        <label className="text-xs font-medium">{t('announcements:form.visibleTo')}</label>
        <div className="flex flex-wrap gap-2">
          {roles.data?.map((r) => (
            <label key={r.id} className="inline-flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                value={r.id}
                {...register('visible_to_role_ids')}
                className="accent-primary"
              />
              {r.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleDelete()}
              className="gap-1 text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('announcements:form.delete')}
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onDone?.()}>
            {t('announcements:form.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('announcements:form.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
