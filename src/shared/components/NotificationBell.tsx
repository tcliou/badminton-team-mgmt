import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { cn } from '@/shared/utils/cn';

/**
 * TopBar 中的通知鈴鐺按鈕。
 * - 有未讀通知時顯示紅點 badge
 * - 點擊展開下拉通知列表
 * - 點擊通知項目導向對應頁面並關閉下拉
 */
export function NotificationBell() {
  const { items, total } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 點選外部時關閉 dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="notification-bell-btn"
        aria-label={total > 0 ? `${total} 則通知` : '通知'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {total > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="通知列表"
          className={cn(
            'absolute right-0 top-11 z-50 min-w-[220px] rounded-xl border bg-card shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150',
          )}
        >
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">目前沒有待處理通知</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      void navigate(item.path);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-accent"
                  >
                    <span>{item.label}</span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {item.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
