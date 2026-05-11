import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, ChevronLeft } from 'lucide-react';
import { usePlayer, usePlayerRecentLeaves } from '../api/playersApi';
import { Avatar } from '../components/Avatar';
import { ProfileEditCard } from '../components/ProfileEditCard';
import { MatchRecords } from '../components/MatchRecords';
import { Experiences } from '../components/Experiences';
import { PlayerPaymentsList } from '../components/PlayerPaymentsList';
import { AvatarUploadDialog } from '../components/AvatarUploadDialog';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';
import { useAuthStore } from '@/core/store/authStore';
import { useCan } from '@/core/acl/useCan';
import { PERMISSIONS } from '@/core/acl/permissions';
import { formatDateTime } from '@/shared/utils/dates';
import { PATHS } from '@/core/router/paths';

export default function PlayerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePlayer(id);
  const myId = useAuthStore((s) => s.profile?.id);
  const canManage = useCan(PERMISSIONS.ActionPlayersManage);
  const recentLeaves = usePlayerRecentLeaves(id, 5);
  const [avatarOpen, setAvatarOpen] = useState(false);

  if (isLoading) return <Loading fullscreen />;
  if (!data) return <EmptyState title={t('errors.notFoundTitle')} />;

  const isSelf = myId === data.id;
  const canEdit = isSelf || canManage;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        to={PATHS.Players}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {t('players:profile.back')}
      </Link>

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

      <ProfileEditCard profile={data} canEdit={canEdit} />

      <MatchRecords playerId={data.id} canEdit={canEdit} />
      <Experiences playerId={data.id} canEdit={canEdit} />

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('players:leaves.title')}</h2>
          {isSelf ? (
            <Link to={PATHS.Leaves} className="text-xs text-primary hover:underline">
              {t('players:leaves.open')}
            </Link>
          ) : null}
        </header>
        {recentLeaves.isLoading ? (
          <Loading />
        ) : !recentLeaves.data || recentLeaves.data.length === 0 ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <ul className="divide-y text-sm">
            {recentLeaves.data.map((lv) => (
              <li key={lv.id} className="py-2">
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(lv.start_at)} – {formatDateTime(lv.end_at, 'HH:mm')}
                </p>
                <p>
                  {t(`leaves:status.${lv.status}`)} · {t(`leaves:reason.${lv.reason_type}`)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('players:payments.title')}</h2>
          {isSelf ? (
            <Link to={PATHS.Payments} className="text-xs text-primary hover:underline">
              {t('players:payments.openMine')}
            </Link>
          ) : null}
        </header>
        <PlayerPaymentsList playerId={data.id} />
      </section>

      <AvatarUploadDialog
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        profileId={data.id}
      />
    </div>
  );
}
