import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useActivePlayers } from '../api/playersApi';
import { Avatar } from '../components/Avatar';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';

export default function PlayersPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useActivePlayers();
  const [q, setQ] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        <h1 className="text-xl font-bold md:text-2xl">{t('players:title')}</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('players:search')}
              className="pl-8"
              aria-label={t('common.search')}
            />
          </div>
          <div className="flex items-center rounded-md border p-1 bg-muted/30 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded px-2.5 py-1.5 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title="大尺寸卡片"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-2.5 py-1.5 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title="小圖示列表"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('players:list.empty')} />
      ) : viewMode === 'list' ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                to={`/players/${p.id}`}
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
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/players/${p.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              {/* Image Section */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                {p.avatar_url ? (
                  <img 
                    src={p.avatar_url} 
                    alt={p.display_name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                    <span className="text-6xl font-bold text-primary/40">{p.display_name[0]}</span>
                  </div>
                )}
                {/* Gradient Overlay for Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                
                {/* Info overlaid on image */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight truncate">{p.display_name}</h3>
                  <p className="text-sm font-medium text-white/90 bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded truncate max-w-full">
                    @{p.username}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
