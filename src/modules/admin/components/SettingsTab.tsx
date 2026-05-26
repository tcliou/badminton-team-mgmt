import { useTranslation } from 'react-i18next';
import { useTeamSettings, useUpdateTeamSettings } from '@/core/api/settingsApi';
import { navModules } from '@/core/router/moduleRegistry';
import { Button } from '@/shared/components/Button';
import { ChevronUp, ChevronDown, Save, Loader2 } from 'lucide-react';
import { resolveNavIcon } from '@/shared/components/navIcons';
import { useState, useEffect } from 'react';

export function SettingsTab() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useTeamSettings();
  const { mutate: updateSettings, isPending } = useUpdateTeamSettings();
  
  const [order, setOrder] = useState<string[]>([]);
  
  useEffect(() => {
    if (settings) {
      // 確保陣列包含所有顯示在 nav 的模組
      const allModules = navModules();
      const savedOrder = settings.nav_order || [];
      
      // 取出目前有的
      const existing = savedOrder.filter(id => allModules.some(m => m.id === id));
      // 補上還沒儲存過的
      const missing = allModules.filter(m => !savedOrder.includes(m.id)).map(m => m.id);
      
      setOrder([...existing, ...missing]);
    }
  }, [settings]);

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">{t('common:loading')}</div>;
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index] as string, newOrder[index - 1] as string];
    setOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1] as string, newOrder[index] as string];
    setOrder(newOrder);
  };

  const handleSave = () => {
    updateSettings(order);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold">{t('admin:settings.navOrder.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('admin:settings.navOrder.description')}
          </p>
        </header>

        <div className="space-y-2 mb-6">
          {order.map((id, index) => {
            const mod = navModules().find((m) => m.id === id);
            if (!mod) return null;
            const Icon = resolveNavIcon(mod.navIcon);
            
            return (
              <div 
                key={id}
                className="flex items-center justify-between rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium">{t(mod.navLabelKey)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    disabled={index === order.length - 1}
                    onClick={() => handleMoveDown(index)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('common:save')}
        </Button>
      </section>
    </div>
  );
}
