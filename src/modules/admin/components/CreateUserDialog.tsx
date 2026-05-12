import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check, UserPlus } from 'lucide-react';
import { useCreateUser, type CreateUserResult } from '../api/createUserApi';
import { useAllRoles } from '@/modules/announcements/api/rolesApi';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

/* ── Schema ──────────────────────────────────────────────────── */

const schema = z.object({
  username: z
    .string()
    .min(2, 'minLength')
    .max(30, 'maxLength')
    .regex(/^[a-z0-9_]+$/, 'invalidChars'),
  display_name: z.string().min(1, 'required'),
  role_id: z.string().uuid('required'),
});
type FormData = z.infer<typeof schema>;

/* ── Props ───────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ── Component ───────────────────────────────────────────────── */

export function CreateUserDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const roles = useAllRoles();
  const createUser = useCreateUser();
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    const res = await createUser.mutateAsync(data);
    setResult(res);
  };

  const handleClose = () => {
    reset();
    setResult(null);
    setCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl">

        {/* ── 步驟 A：填寫表單 ─────────────────────────────── */}
        {!result ? (
          <>
            <header className="flex items-center gap-2 border-b p-4">
              <UserPlus className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-base font-semibold">{t('admin:createUser.title')}</h2>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4" noValidate>
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="cu-username" className="text-sm font-medium">
                  {t('admin:createUser.username')}
                </label>
                <Input
                  id="cu-username"
                  placeholder={t('admin:createUser.usernamePlaceholder')}
                  autoComplete="off"
                  {...register('username')}
                  aria-invalid={Boolean(errors.username)}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">
                    {t(`admin:createUser.errors.${errors.username.message ?? 'invalid'}`)}
                  </p>
                )}
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <label htmlFor="cu-display" className="text-sm font-medium">
                  {t('admin:createUser.displayName')}
                </label>
                <Input
                  id="cu-display"
                  placeholder={t('admin:createUser.displayNamePlaceholder')}
                  {...register('display_name')}
                  aria-invalid={Boolean(errors.display_name)}
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive">
                    {t('admin:createUser.errors.required')}
                  </p>
                )}
              </div>

              {/* Initial role */}
              <div className="space-y-1.5">
                <label htmlFor="cu-role" className="text-sm font-medium">
                  {t('admin:createUser.initialRole')}
                </label>
                <select
                  id="cu-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('role_id')}
                  aria-invalid={Boolean(errors.role_id)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t('admin:createUser.rolePlaceholder')}
                  </option>
                  {(roles.data ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.description ? ` — ${r.description}` : ''}
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="text-xs text-destructive">
                    {t('admin:createUser.errors.required')}
                  </p>
                )}
              </div>

              {/* Server error */}
              {createUser.error && (
                <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {(createUser.error as Error).message}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting || createUser.isPending}>
                  {isSubmitting || createUser.isPending
                    ? t('common.loading')
                    : t('admin:createUser.create')}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* ── 步驟 B：顯示一次性密碼 ──────────────────────── */
          <>
            <header className="border-b p-4">
              <h2 className="text-base font-semibold">{t('admin:createUser.successTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('admin:createUser.successDesc', { name: result.display_name })}
              </p>
            </header>

            <div className="space-y-4 p-4">
              {/* 帳號資訊 */}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">{t('admin:createUser.username')}：</span>
                  <span className="font-medium">@{result.username}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t('admin:createUser.displayName')}：</span>
                  <span className="font-medium">{result.display_name}</span>
                </p>
              </div>

              {/* 一次性密碼 */}
              <div>
                <p className="mb-1.5 text-sm font-medium">{t('admin:createUser.tempPassword')}</p>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary bg-primary/5 p-3">
                  <code className="flex-1 text-center text-xl font-bold tracking-widest text-primary">
                    {result.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="rounded-md p-1.5 hover:bg-accent"
                    aria-label={t('admin:createUser.copy')}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-destructive">
                  {t('admin:createUser.tempPasswordWarning')}
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>{t('common.confirm')}</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
