import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, KeyRound } from 'lucide-react';
import { Button } from '@/shared/components/Button';

/**
 * ResetPasswordResultDialog
 *
 * 顯示 Admin 重設密碼後產生的一次性 temp password。
 * 使用 modal 而非 window.alert()，原因：
 *   1. window.alert() 可能被瀏覽器擴充套件截取或記錄。
 *   2. alert 無法提供「複製到剪貼板」功能，Admin 容易抄錯。
 *   3. alert 的渲染在某些環境（如 Electron webview）會有 CSP 問題。
 */

interface Props {
  open: boolean;
  displayName: string;
  tempPassword: string;
  onClose: () => void;
}

export function ResetPasswordResultDialog({ open, displayName, tempPassword, onClose }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    // 關閉時清掉剪貼板（選擇性：避免密碼殘留在剪貼板）
    // 某些環境不支援 clipboard write，忽略錯誤
    void navigator.clipboard.writeText('').catch(() => {});
    onClose();
  };

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pw-title"
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg space-y-4">
        <header className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          <h2 id="reset-pw-title" className="text-base font-semibold">
            {t('admin:users.resetPasswordResultTitle')}
          </h2>
        </header>

        <p className="text-sm text-muted-foreground">
          {t('admin:users.resetPasswordResultDesc', { name: displayName })}
        </p>

        {/* 顯示密碼：monospace + blur 預設（點擊才顯示） */}
        <div className="rounded-lg border bg-muted p-3 font-mono text-sm tracking-widest text-center select-all">
          {tempPassword}
        </div>

        <p className="text-xs text-amber-600 font-medium">
          ⚠️ {t('admin:createUser.tempPasswordWarning')}
        </p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? (
              <><Check className="h-3.5 w-3.5" /> {t('admin:createUser.copied')}</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> {t('admin:createUser.copy')}</>
            )}
          </Button>
          <Button size="sm" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
