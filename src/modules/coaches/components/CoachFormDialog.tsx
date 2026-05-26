import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutateCoach, useCoachUserOptions } from '../api/coachesApi';
import type { CoachProfile } from '@/core/supabase/types';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

const schema = z.object({
  name: z.string().min(1, '必填'),
  title: z.string().optional(),
  cv: z.string().optional(),
  avatar_url: z.string().optional(),
  is_active: z.boolean().default(true),
  user_id: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  coach?: CoachProfile;
}

export function CoachFormDialog({ open, onClose, coach }: Props) {
  const mutateCoach = useMutateCoach();
  const { data: userOptions } = useCoachUserOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      title: '',
      cv: '',
      avatar_url: '',
      is_active: true,
      user_id: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (coach) {
        reset({
          name: coach.name,
          title: coach.title || '',
          cv: coach.cv || '',
          avatar_url: coach.avatar_url || '',
          is_active: coach.is_active,
          user_id: coach.user_id || null,
        });
      } else {
        reset({
          name: '',
          title: '',
          cv: '',
          avatar_url: '',
          is_active: true,
          user_id: null,
        });
      }
    }
  }, [open, coach, reset]);

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    await mutateCoach.mutateAsync({
      id: coach?.id,
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
        <h2 className="mb-4 text-lg font-semibold">{coach ? '編輯教練' : '新增教練'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">姓名 *</label>
            <Input {...register('name')} placeholder="教練姓名" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">頭銜 / 稱號</label>
            <Input {...register('title')} placeholder="例如：總教練、客座教練" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">個人照片網址</label>
            <Input {...register('avatar_url')} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">經歷介紹 (CV)</label>
            <textarea
              {...register('cv')}
              rows={5}
              placeholder="輸入教練介紹..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">連結系統帳號 (選填)</label>
            <select
              {...register('user_id')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- 不綁定帳號 --</option>
              {userOptions?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} />
            <label htmlFor="is_active" className="text-sm">是否在職 (顯示於清單)</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || mutateCoach.isPending}>
              {isSubmitting ? '...' : '儲存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
