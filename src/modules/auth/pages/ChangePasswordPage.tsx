import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth';
import { fetchMyProfile } from '@/core/auth/authApi';
import { useAuthStore } from '@/core/store/authStore';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { PATHS } from '@/core/router/paths';

const schema = z
  .object({
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'mismatch',
  });
type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const { changePassword, profile } = useAuth();
  const navigate = useNavigate();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setErrMsg(null);
    setOkMsg(null);
    try {
      await changePassword(data.newPassword);
      const fresh = await fetchMyProfile();
      setProfile(fresh);
      setOkMsg(t('auth.changePasswordSuccess'));
      setTimeout(() => navigate(PATHS.Home, { replace: true }), 600);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">{t('auth.changePassword')}</h1>
        {profile?.must_change_password ? (
          <p className="mb-4 text-sm text-muted-foreground">{t('auth.mustChangePassword')}</p>
        ) : null}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium">
              {t('auth.newPassword')}
            </label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              aria-invalid={Boolean(errors.newPassword)}
            />
            {errors.newPassword ? (
              <p className="text-xs text-destructive">{t('auth.passwordTooShort')}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t('auth.confirmPassword')}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{t('auth.passwordMismatch')}</p>
            ) : null}
          </div>
          {okMsg ? (
            <p role="status" className="rounded-md bg-emerald-100 p-2 text-sm text-emerald-700">
              {okMsg}
            </p>
          ) : null}
          {errMsg ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {errMsg}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.changePassword')}
          </Button>
        </form>
      </div>
    </div>
  );
}
