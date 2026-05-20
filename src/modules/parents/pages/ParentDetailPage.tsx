import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, ChevronLeft, Link2, Trash2, UserPlus } from 'lucide-react';
import { usePlayer } from '@/modules/players/api/playersApi';
import { useActiveParents, useLinkedPlayers, useLinkPlayer, useUnlinkPlayer } from '../api/parentsApi';
import { Avatar } from '@/modules/players/components/Avatar';
import { ProfileEditCard } from '@/modules/players/components/ProfileEditCard';
import { AvatarUploadDialog } from '@/modules/players/components/AvatarUploadDialog';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/core/store/authStore';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';
import { PATHS } from '@/core/router/paths';
import { useActivePlayers } from '@/modules/players/api/playersApi';

export default function ParentDetailPage() {
  const { t } = useTranslation(['parents', 'players', 'common']);
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePlayer(id);
  const myId = useAuthStore((s) => s.profile?.id);
  const canManage = useCan(PERMISSIONS.ActionPlayersManage);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [relationship, setRelationship] = useState('');

  const linkedQuery = useLinkedPlayers(id);
  const allPlayersQuery = useActivePlayers();
  const linkMutation = useLinkPlayer(id ?? '');
  const unlinkMutation = useUnlinkPlayer(id ?? '');

  if (isLoading) return <Loading fullscreen />;
  if (!data) return <EmptyState title={t('common:errors.notFoundTitle', '找不到頁面')} />;

  const isSelf = myId === data.id;
  const canEdit = isSelf || canManage;

  const linkedPlayerIds = new Set(linkedQuery.data?.map((r) => r.player_id) ?? []);
  const availablePlayers = (allPlayersQuery.data ?? []).filter((p) => !linkedPlayerIds.has(p.id));

  const handleLink = async () => {
    if (!selectedPlayerId) return;
    await linkMutation.mutateAsync({ playerId: selectedPlayerId, relationship: relationship || undefined });
    setSelectedPlayerId('');
    setRelationship('');
    setLinkOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* 返回列表 */}
      <Link
        to={PATHS.Parents}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {t('parents:title')}
      </Link>

      {/* 頭像 + 名稱 */}
      <header className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <div className="relative">
          <Avatar
            url={data.avatar_url}
            name={data.display_name}
            username={data.username}
            size="lg"
          />
          {canEdit ? (
            <button
              type="button"
              onClick={() => setAvatarOpen(true)}
              className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground"
              aria-label={t('players:avatar.edit')}
              title={t('players:avatar.edit')}
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{data.display_name}</h1>
          <p className="text-sm text-muted-foreground">@{data.username}</p>
        </div>
      </header>

      {/* 個人資料編輯卡（沿用球員共用元件） */}
      <ProfileEditCard profile={data} canEdit={canEdit} />

      {/* 綁定的球員 */}
      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Link2 className="h-4 w-4 text-primary" aria-hidden />
            {t('parents:linkedPlayers.title')}
          </h2>
          {canManage ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setLinkOpen((v) => !v)}
              aria-expanded={linkOpen}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              {t('parents:linkedPlayers.add')}
            </Button>
          ) : null}
        </header>

        {/* 新增綁定表單（展開） */}
        {linkOpen && canManage ? (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium" htmlFor="link-player-select">
                {t('players:title')}
              </label>
              <select
                id="link-player-select"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
              >
                <option value="">-- {t('parents:linkedPlayers.add')} --</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} (@{p.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium" htmlFor="link-relationship">
                {t('parents:linkedPlayers.relationship')}
              </label>
              <input
                id="link-relationship"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t('parents:linkedPlayers.relationship')}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={() => void handleLink()}
              disabled={!selectedPlayerId || linkMutation.isPending}
            >
              {t('common:confirm')}
            </Button>
          </div>
        ) : null}

        {/* 已綁定列表 */}
        {linkedQuery.isLoading ? (
          <Loading />
        ) : !linkedQuery.data || linkedQuery.data.length === 0 ? (
          <EmptyState title={t('parents:linkedPlayers.empty')} />
        ) : (
          <ul className="divide-y">
            {linkedQuery.data.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2">
                <Avatar
                  url={row.player.avatar_url}
                  name={row.player.display_name}
                  username={row.player.username}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.player.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{row.player.username}
                    {row.relationship ? ` · ${row.relationship}` : ''}
                  </p>
                </div>
                <Link
                  to={`${PATHS.Players}/${row.player_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  {t('players:list.viewProfile')}
                </Link>
                {canManage ? (
                  <button
                    type="button"
                    title={t('parents:linkedPlayers.remove')}
                    aria-label={t('parents:linkedPlayers.remove')}
                    onClick={() => {
                      if (window.confirm(t('parents:linkedPlayers.confirmRemove'))) {
                        void unlinkMutation.mutateAsync(row.id);
                      }
                    }}
                    disabled={unlinkMutation.isPending}
                    className="ml-1 rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AvatarUploadDialog
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        profileId={data.id}
      />
    </div>
  );
}
