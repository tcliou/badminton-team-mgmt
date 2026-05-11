import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { PaymentRecordStatus } from '@/core/supabase/types';

type Status = PaymentRecordStatus | 'unpaid';

const STYLE: Record<Status, string> = {
  unpaid: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export function PaymentStatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STYLE[status])}>
      {t(`payments:status.${status}`)}
    </span>
  );
}
