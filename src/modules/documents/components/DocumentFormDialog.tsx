import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutateDocument } from '../api/documentsApi';
import type { DocumentRow } from '@/core/supabase/types';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

const schema = z.object({
  title: z.string().min(1, '必填'),
  url: z.string().url('請輸入有效的網址').min(1, '必填'),
  description: z.string().optional(),
  visible_to_role_ids: z.array(z.string()),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  document?: DocumentRow;
}

export function DocumentFormDialog({ open, onClose, document }: Props) {
  const mutateDoc = useMutateDocument();
  const { data: roles } = useAllRoles(); // { id, name, description }[]

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      visible_to_role_ids: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (document) {
        reset({
          title: document.title,
          url: document.url,
          description: document.description || '',
          visible_to_role_ids: document.visible_to_role_ids || [],
        });
      } else {
        reset({
          title: '',
          url: '',
          description: '',
          visible_to_role_ids: [],
        });
      }
    }
  }, [open, document, reset]);

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    await mutateDoc.mutateAsync({
      id: document?.id,
      ...data,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-4 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">{document ? '編輯文件' : '新增文件'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">標題 *</label>
            <Input {...register('title')} placeholder="文件標題" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">網址 (URL) *</label>
            <Input {...register('url')} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">描述 (選填)</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="簡單描述此文件..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium">可見對象 (不勾選代表全體可見)</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Controller
                control={control}
                name="visible_to_role_ids"
                render={({ field: { value, onChange } }) => (
                  <>
                    {roles?.map((role) => (
                      <label key={role.id} className="flex items-center gap-2 text-sm cursor-pointer border rounded p-2 hover:bg-accent/50">
                        <input
                          type="checkbox"
                          checked={value.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChange([...value, role.id]);
                            } else {
                              onChange(value.filter((id) => id !== role.id));
                            }
                          }}
                        />
                        <span>{role.name}</span>
                      </label>
                    ))}
                  </>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || mutateDoc.isPending}>
              {isSubmitting ? '...' : '儲存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
