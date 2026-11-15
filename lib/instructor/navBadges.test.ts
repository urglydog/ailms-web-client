import { describe, expect, it } from 'vitest';
import { navBadgeCounts, sectionBadgeCounts } from './navBadges';

describe('navBadgeCounts', () => {
  it('đếm thông báo chưa đọc theo mục menu dựa trên đường dẫn liên kết', () => {
    const counts = navBadgeCounts([
      { isRead: false, linkUrl: '/instructor/communication/refunds' },
      { isRead: false, linkUrl: '/instructor/communication/messages' },
      { isRead: false, linkUrl: '/instructor/earnings' },
      { isRead: false, linkUrl: '/instructor/share' },
    ]);
    expect(counts).toEqual({ communication: 2, earnings: 1, tools: 1 });
  });

  it('bỏ qua thông báo đã đọc, không có liên kết hoặc liên kết ngoài Kênh giảng viên; chịu được query/hash', () => {
    const counts = navBadgeCounts([
      { isRead: true, linkUrl: '/instructor/earnings' },
      { isRead: false, linkUrl: null },
      { isRead: false, linkUrl: '/materials?courseId=3' },
      { isRead: false, linkUrl: '/instructor/earnings?tab=1#x' },
    ]);
    expect(counts).toEqual({ earnings: 1 });
  });
});

describe('sectionBadgeCounts', () => {
  it('đếm thông báo chưa đọc theo tab con của khu Giao tiếp', () => {
    const counts = sectionBadgeCounts(
      [
        { isRead: false, linkUrl: '/instructor/communication/refunds' },
        { isRead: false, linkUrl: '/instructor/communication/refunds?x=1' },
        { isRead: false, linkUrl: '/instructor/communication/messages' },
        { isRead: true, linkUrl: '/instructor/communication/qa' },
        { isRead: false, linkUrl: '/instructor/earnings' },
      ],
      '/instructor/communication/',
      ['qa', 'messages', 'assignments', 'announcements', 'refunds'],
    );
    expect(counts).toEqual({ refunds: 2, messages: 1 });
  });
});
