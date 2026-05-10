import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaveForm } from '../components/LeaveForm';
import { MyLeavesList } from '../components/MyLeavesList';
import { PendingReviewList } from '../components/PendingReviewList';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';
import { cn } from '@/shared/utils/cn';

type Tab = 'mine' | 'review';

export default function LeavesPage() {
  const { t } = useTranslation();
  const canReview = useCan(PERMISSIONS.ActionLeavesApprove);
  const [tab, setTab] = useState<Tab>('mine');

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('leaves:title')}</h1>
      </header>

      {canReview ? (
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
            {t('leaves:tabs.mine')}
          </TabButton>
          <TabButton active={tab === 'review'} onClick={() => setTab('review')}>
            {t('leaves:tabs.review')}
          </TabButton>
        </div>
      ) : null}

      {tab === 'mine' ? (
        <div className="space-y-4">
          <LeaveForm />
          <MyLeavesList />
        </div>
      ) : (
        <PendingReviewList />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
