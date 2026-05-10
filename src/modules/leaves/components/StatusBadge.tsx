import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { LeaveStatus } from '@/core/supabase/types';

const STYLE: Record<LeaveStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STYLE[status])}>
      {t(`leaves:status.${status}`)}
    </span>
  );
}
