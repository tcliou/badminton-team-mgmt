import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, subMonths } from 'date-fns';
import { TrainingList } from '../components/TrainingList';
import { SingleTrainingForm } from '../components/SingleTrainingForm';
import { RecurringTrainingForm } from '../components/RecurringTrainingForm';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';
import { cn } from '@/shared/utils/cn';

type Tab = 'upcoming' | 'past';

export default function TrainingPage() {
  const { t } = useTranslation();
  const canManage = useCan(PERMISSIONS.ActionTrainingManage);
  const [tab, setTab] = useState<Tab>('upcoming');

  const now = new Date();
  const upcoming = { from: now, to: addDays(now, 30) };
  const past = { from: subMonths(now, 3), to: now };
  const range = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t('training:title')}</h1>
      </header>

      {canManage ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <SingleTrainingForm />
          <RecurringTrainingForm />
        </div>
      ) : null}

      <div className="flex gap-1 rounded-lg border bg-card p-1">
        <TabButton active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          {t('training:tabs.upcoming')}
        </TabButton>
        <TabButton active={tab === 'past'} onClick={() => setTab('past')}>
          {t('training:tabs.past')}
        </TabButton>
      </div>

      <TrainingList
        fromDate={range.from}
        toDate={range.to}
        emptyKey={tab === 'upcoming' ? 'noUpcoming' : 'noPast'}
      />
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
