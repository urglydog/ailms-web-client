import { INSTRUCTOR_NAV, isInstructorNavActive } from '@/lib/instructor/nav';

/** Chỉ cần 2 trường của thông báo — tránh phụ thuộc kiểu nội bộ của NotificationProvider. */
interface BadgeNotification {
  isRead: boolean;
  linkUrl: string | null;
}

/**
 * Số thông báo CHƯA ĐỌC theo từng mục menu bên trái của Kênh giảng viên: thông báo thuộc mục nào khi `linkUrl` của nó nằm trong mục đó
 * (cùng quy tắc khớp đường dẫn với việc làm sáng menu, kể cả `alsoMatches`). Mục không có thông báo thì không có khóa trong kết quả.
 */
export function navBadgeCounts(notifications: BadgeNotification[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of notifications) {
    if (n.isRead || !n.linkUrl) continue;
    const path = n.linkUrl.split(/[?#]/)[0] ?? '';
    const item = INSTRUCTOR_NAV.find((i) => [i.href, ...(i.alsoMatches ?? [])].some((h) => isInstructorNavActive(path, h)));
    if (item) counts[item.id] = (counts[item.id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Số thông báo chưa đọc theo từng TAB con của một khu (vd Giao tiếp: Hỏi đáp/Tin nhắn/Bài tập/Thông báo/Hoàn tiền): thông báo thuộc tab nào khi
 * `linkUrl` của nó nằm trong `<prefix><khóa>`. Dùng để chỉ rõ thông báo mới ở TAB nào chứ không chỉ ở cả mục menu.
 */
export function sectionBadgeCounts(notifications: BadgeNotification[], prefix: string, keys: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of notifications) {
    if (n.isRead || !n.linkUrl) continue;
    const path = n.linkUrl.split(/[?#]/)[0] ?? '';
    const key = keys.find((k) => path === `${prefix}${k}` || path.startsWith(`${prefix}${k}/`));
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
