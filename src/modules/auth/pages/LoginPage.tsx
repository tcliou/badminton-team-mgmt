import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { LocaleSwitcher } from '@/core/i18n/LocaleSwitcher';
import { PATHS } from '@/core/router/paths';

const schema = z.object({
  username: z.string().min(2),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (isAuthenticated) {
    const to = (location.state as { from?: string } | null)?.from ?? PATHS.Home;
    return <Navigate to={to} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await signIn(data.username, data.password);
      navigate(PATHS.Home, { replace: true });
    } catch {
      setServerError(t('auth.signInError'));
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold">{import.meta.env.VITE_APP_NAME ?? t('appName')}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t('auth:tagline')}</p>
        </header>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              {t('auth.username')}
            </label>
            <Input
              id="username"
              autoComplete="username"
              placeholder={t('auth.usernamePlaceholder')}
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </div>
          {serverError ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.signIn')}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Badminton Team Manager
      </p>
    </div>
  );
}
