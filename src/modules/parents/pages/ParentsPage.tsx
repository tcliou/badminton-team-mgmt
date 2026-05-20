import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useActiveParents } from '../api/parentsApi';
import { Avatar } from '@/modules/players/components/Avatar';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { PATHS } from '@/core/router/paths';

export default function ParentsPage() {
  const { t } = useTranslation('parents');
  const { data, isLoading } = useActiveParents();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q.trim()) return data;
    const needle = q.trim().toLowerCase();
    return data.filter(
      (p) =>
        p.display_name.toLowerCase().includes(needle) ||
        p.username.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold md:text-2xl">{t('title')}</h1>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="pl-8"
            aria-label={t('search')}
          />
        </div>
      </header>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('list.empty')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                to={`${PATHS.Parents}/${p.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary"
              >
                <Avatar url={p.avatar_url} name={p.display_name} username={p.username} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
