import mitt from 'mitt';

/**
 * 跨模組事件匯流排。命名規則：`<module>:<verb>`，例如 `leaves:created`。
 * 模組可廣播事件，其他模組監聽以觸發 invalidateQueries 等副作用。
 */
export type AppEvents = {
  'leaves:created': { leaveId: string };
  'leaves:reviewed': { leaveId: string };
  'training:created': { trainingId: string };
  'announcements:published': { announcementId: string };
  'payments:registered': { recordId: string };
  'payments:confirmed': { recordId: string };
};

export const eventBus = mitt<AppEvents>();
