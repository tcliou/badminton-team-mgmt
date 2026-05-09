import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useUiStore, type Locale } from '../store/uiStore';
import { cn } from '@/shared/utils/cn';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh-TW', label: '中' },
  { value: 'en', label: 'EN' },
];

export function LocaleSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const setLocale = useUiStore((s) => s.setLocale);
  const current = (i18n.resolvedLanguage as Locale) || 'zh-TW';

  const change = (loc: Locale) => {
    setLocale(loc);
    void i18n.changeLanguage(loc);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border bg-card p-0.5 text-xs',
        className,
      )}
      role="group"
      aria-label="Language switcher"
    >
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => change(l.value)}
          className={cn(
            'min-w-[28px] rounded px-2 py-1 transition',
            current === l.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
          aria-pressed={current === l.value}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
