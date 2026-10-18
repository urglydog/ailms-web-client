import { describe, expect, it } from 'vitest';
import { groupNotifications, type NotificationItem } from './groups';

function n(id: number, overrides: Partial<NotificationItem> = {}): NotificationItem {
  return { id, title: `T${id}`, content: 'c', linkUrl: null, isRead: false, createdAt: '2026-10-01T00:00:00', ...overrides };
}

describe('groupNotifications', () => {
  it('tách tin hệ thống (type bắt đầu bằng SYSTEM_) khỏi tin chính', () => {
    const g = groupNotifications([n(1), n(2, { type: 'SYSTEM_ANNOUNCEMENT' }), n(3, { type: 'COURSE_APPROVED' })]);
    expect(g.main.map((x) => x.id)).toEqual([1, 3]);
    expect(g.system.map((x) => x.id)).toEqual([2]);
  });

  it('nhóm chưa đọc gồm mọi loại chưa đọc', () => {
    const g = groupNotifications([n(1, { isRead: true }), n(2, { type: 'SYSTEM_X' }), n(3)]);
    expect(g.unread.map((x) => x.id)).toEqual([2, 3]);
  });

  it('danh sách rỗng cho ra ba nhóm rỗng', () => {
    expect(groupNotifications([])).toEqual({ main: [], system: [], unread: [] });
  });
});
