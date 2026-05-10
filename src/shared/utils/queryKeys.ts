/**
 * 集中所有 TanStack Query 的 cache key，
 * 避免多模組之間因 key 拼錯而抓不到對方刷新訊號。
 */
export const QK = {
  profile: {
    me: ['profile', 'me'] as const,
    list: ['profiles', 'list'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
  },
  calendar: {
    teamRange: (fromIso: string, toIso: string) =>
      ['calendar', 'team', fromIso, toIso] as const,
    personalRange: (ownerId: string, fromIso: string, toIso: string) =>
      ['calendar', 'personal', ownerId, fromIso, toIso] as const,
  },
  training: {
    list: (fromIso: string, toIso: string) => ['training', 'list', fromIso, toIso] as const,
    detail: (id: string) => ['training', 'detail', id] as const,
    attendance: (id: string) => ['training', 'attendance', id] as const,
  },
  leaves: {
    mine: ['leaves', 'mine'] as const,
    pending: ['leaves', 'pending'] as const,
    forPlayer: (playerId: string) => ['leaves', 'player', playerId] as const,
  },
  player: {
    matches: (playerId: string) => ['player', 'matches', playerId] as const,
    experiences: (playerId: string) => ['player', 'experiences', playerId] as const,
  },
} as const;
