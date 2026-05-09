import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export function Loading({ fullscreen = false, label }: { fullscreen?: boolean; label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-muted-foreground',
        fullscreen ? 'min-h-screen w-full' : 'p-8',
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}
