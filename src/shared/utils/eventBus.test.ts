import { describe, it, expect, vi } from 'vitest';
import { eventBus } from './eventBus';

describe('eventBus', () => {
  it('on 監聽後，emit 觸發 handler', () => {
    const handler = vi.fn();
    eventBus.on('leaves:created', handler);
    eventBus.emit('leaves:created', { leaveId: 'l-1' });
    expect(handler).toHaveBeenCalledWith({ leaveId: 'l-1' });
    eventBus.off('leaves:created', handler);
  });

  it('off 之後，emit 不再觸發', () => {
    const handler = vi.fn();
    eventBus.on('announcements:published', handler);
    eventBus.off('announcements:published', handler);
    eventBus.emit('announcements:published', { announcementId: 'a-1' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('多個 handler 同時監聽同一事件', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    eventBus.on('payments:confirmed', h1);
    eventBus.on('payments:confirmed', h2);
    eventBus.emit('payments:confirmed', { recordId: 'r-1' });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    eventBus.off('payments:confirmed', h1);
    eventBus.off('payments:confirmed', h2);
  });
});
