import { useTranslation } from 'react-i18next';
import { Megaphone, Pin } from 'lucide-react';
import { useHomeAnnouncements } from '@/modules/announcements/api/announcementsApi';
import { AnnouncementListItem } from '@/modules/announcements/components/AnnouncementListItem';
import { Loading } from '@/shared/components/Loading';
import { EmptyState } from '@/shared/components/EmptyState';

/**
 * 首頁公告區。
 * 名字保留 Phase 1 的 Placeholder 後綴是因為 import 路徑已被別處引用，
 * 但實作已經是真實資料（Phase 3）。後續 Phase 4 重構時可改名 AnnouncementsSection。
 */
export function AnnouncementsPlaceholder() {
  const { t } = useTranslation();
  const { data, isLoading } = useHomeAnnouncements();

  const pinned = (data ?? []).filter((a) => a.is_pinned);
  const general = (data ?? []).filter((a) => !a.is_pinned);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Megaphone className="h-5 w-5 text-primary" aria-hidden />
          {t('home:sections.announcements')}
        </h2>
      </header>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Pin className="h-3.5 w-3.5" aria-hidden />
              {t('announcements:homeSection.pinned')}
            </p>
            {pinned.length === 0 ? (
              <EmptyState title={t('announcements:homeSection.noPinned')} />
            ) : (
              <ul className="space-y-2">
                {pinned.map((a) => (
                  <AnnouncementListItem key={a.id} row={a} />
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t('announcements:homeSection.general')}
            </p>
            {general.length === 0 ? (
              <EmptyState title={t('announcements:homeSection.noGeneral')} />
            ) : (
              <ul className="space-y-2">
                {general.map((a) => (
                  <AnnouncementListItem key={a.id} row={a} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
