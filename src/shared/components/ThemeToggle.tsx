import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/core/store/uiStore';
import { cn } from '@/shared/utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent',
        className,
      )}
      aria-label={t('common.theme')}
      aria-pressed={isDark}
      title={t('common.theme')}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
