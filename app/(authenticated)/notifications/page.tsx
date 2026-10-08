'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/providers/NotificationProvider';
import { MaterialTabs } from '@/components/materials/ui/MaterialTabs';

/** (08/10/2026, sửa lỗi) — trước đây trang tự fetch riêng bằng type cục bộ thiếu `linkUrl`,
 * không có onClick nào nên bấm vào dòng thông báo không điều hướng đi đâu cả. Chuyển sang dùng
 * chung `useNotification()` (đã có sẵn từ dropdown chuông) để đồng bộ badge + list, và thêm
 * điều hướng theo `linkUrl` khi bấm.
 *
 * Chỉ duy nhất `SystemAnnouncementService` sinh ra type dạng "SYSTEM_*" (SYSTEM_HIGH/MEDIUM/LOW)
 * — mọi type còn lại đều là tin khóa học/tương tác, nên quy tắc phân tab đơn giản và khớp 100%
 * dữ liệu thật: `type` bắt đầu bằng "SYSTEM_" → tab Hệ thống, còn lại → tab Tin chính.
 */
const getTypeLabel = (type?: string) => {
  const labels: { [key: string]: string } = {
    NEW_MESSAGE: 'Tin nhắn',
    ANNOUNCEMENT: 'Thông báo khóa học',
    COURSE_COMPLETED: 'Chứng chỉ',
    ASSIGNMENT_GRADED: 'Chấm bài tập',
    DUBBING_COMPLETED: 'Lồng tiếng xong',
    DUBBING_FAILED: 'Lồng tiếng lỗi',
    WISHLIST_PRICE_DROP: 'Giảm giá khóa học yêu thích',
    STREAK_REMINDER: 'Nhắc duy trì chuỗi học',
    SRS_REMINDER: 'Ôn tập Flashcard',
    SYSTEM_HIGH: 'Thông báo hệ thống',
    SYSTEM_MEDIUM: 'Thông báo hệ thống',
    SYSTEM_LOW: 'Thông báo hệ thống',
  };
  return (type && labels[type]) || type || 'Thông báo';
};

const getTypeColor = (type?: string) => {
  if (type === 'DUBBING_FAILED' || type === 'SYSTEM_HIGH') return { bg: '#fee2e2', text: '#991b1b' };
  if (type === 'ANNOUNCEMENT' || type === 'DUBBING_COMPLETED' || type === 'COURSE_COMPLETED') {
    return { bg: '#dcfce7', text: '#166534' };
  }
  if (type === 'SRS_REMINDER' || type === 'WISHLIST_PRICE_DROP' || type === 'STREAK_REMINDER' || type === 'SYSTEM_MEDIUM') {
    return { bg: '#fef3c7', text: '#b45309' };
  }
  return { bg: '#dbeafe', text: '#1e40af' };
};

type TabKey = 'main' | 'system' | 'unread';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead } = useNotification();
  const [activeTab, setActiveTab] = useState<TabKey>('main');

  const mainNotifications = useMemo(
    () => notifications.filter(n => !n.type?.startsWith('SYSTEM_')),
    [notifications]
  );
  const systemNotifications = useMemo(
    () => notifications.filter(n => n.type?.startsWith('SYSTEM_')),
    [notifications]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter(n => !n.isRead),
    [notifications]
  );

  const visibleNotifications =
    activeTab === 'system' ? systemNotifications : activeTab === 'unread' ? unreadNotifications : mainNotifications;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClick = (notif: (typeof notifications)[number]) => {
    if (!notif.isRead) markAsRead(notif.id);
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Thông Báo</h1>

      <MaterialTabs
        className="mb-6"
        tabs={[
          { key: 'main', label: 'Tin chính', count: mainNotifications.length },
          { key: 'system', label: 'Hệ thống', count: systemNotifications.length },
          { key: 'unread', label: 'Đã đọc', count: unreadNotifications.length },
        ]}
        active={activeTab}
        onChange={key => setActiveTab(key as TabKey)}
      />

      {visibleNotifications.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-ink-muted">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map(notif => (
            <button
              key={notif.id}
              type="button"
              onClick={() => handleClick(notif)}
              disabled={!notif.linkUrl}
              className={`w-full text-left p-4 rounded-lg border-l-4 border transition-colors ${
                notif.isRead ? 'bg-surface border-line' : 'bg-surface-raised border-l-accent shadow-card'
              } ${notif.linkUrl ? 'hover:bg-surface-hover cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{ backgroundColor: getTypeColor(notif.type).bg, color: getTypeColor(notif.type).text }}
                    >
                      {getTypeLabel(notif.type)}
                    </span>
                    {!notif.isRead && <span className="inline-block w-2 h-2 bg-accent rounded-full" />}
                  </div>
                  <p className="font-semibold text-ink text-sm">{notif.title}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{notif.content}</p>
                  <p className="text-xs text-ink-muted mt-2">{formatDate(notif.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
