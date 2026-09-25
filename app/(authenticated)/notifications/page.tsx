'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!localStorage.getItem('accessToken')) {
          router.push('/login');
          return;
        }

        // api.get tự refresh access token hết hạn (401) trước khi coi là lỗi thật —
        // trước đây fetch thô ở đây không refresh, chỉ đá thẳng về /login.
        const data = await api.get<Notification[]>('/api/v1/notifications');
        setNotifications(data);
      } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 401) {
          router.push('/login');
          return;
        }
        console.error(e);
        setError(e instanceof Error ? e.message : 'Không thể tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** (20/09/2026, sửa lỗi) — trước đây map theo SUCCESS/WARNING/ERROR/INFO, không khớp bất kỳ
   * `type` thật nào backend từng gửi (`NotificationService.notify`) nên luôn rơi về hiển thị
   * chuỗi type thô. */
  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      NEW_MESSAGE: 'Tin nhắn',
      ANNOUNCEMENT: 'Thông báo khóa học',
      ASSIGNMENT_GRADED: 'Chấm bài tập',
      DUBBING_COMPLETED: 'Lồng tiếng xong',
      DUBBING_FAILED: 'Lồng tiếng lỗi',
      COURSE_APPROVED: 'Khóa học được duyệt',
      NEW_OFFICIAL_MATERIAL: 'Học liệu mới',
      NEW_PERSONAL_MATERIAL: 'Học liệu cá nhân',
      SRS_REMINDER: 'Ôn tập Flashcard',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    if (type === 'DUBBING_FAILED') return { bg: '#fee2e2', text: '#991b1b' };
    if (type === 'ANNOUNCEMENT' || type === 'COURSE_APPROVED' || type === 'DUBBING_COMPLETED') {
      return { bg: '#dcfce7', text: '#166534' };
    }
    if (type === 'SRS_REMINDER') return { bg: '#fef3c7', text: '#b45309' };
    return { bg: '#dbeafe', text: '#1e40af' };
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-ink-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Thông Báo</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-ink-muted">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border-l-4 border ${
                notif.isRead
                  ? 'bg-surface border-line'
                  : 'bg-white border-l-accent shadow-sm'
              }`}
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
                    {!notif.isRead && (
                      <span className="inline-block w-2 h-2 bg-accent rounded-full"></span>
                    )}
                  </div>
                  <p className="font-semibold text-ink text-sm">{notif.title}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{notif.content}</p>
                  <p className="text-xs text-ink-muted mt-2">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
