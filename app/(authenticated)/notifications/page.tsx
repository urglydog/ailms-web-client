'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  message: string;
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
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/notifications`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Không thể tải thông báo');
        }

        const data = await res.json();
        setNotifications(data);
      } catch (e: unknown) {
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

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'SUCCESS': 'Thành công',
      'WARNING': 'Cảnh báo',
      'ERROR': 'Lỗi',
      'INFO': 'Thông tin'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-gray-600">Đang tải...</p>
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
          <p className="text-gray-600">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border-l-4 border ${
                notif.isRead
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-white border-l-blue-500 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded"
                          style={{
                            backgroundColor: notif.type === 'SUCCESS' ? '#dcfce7' : notif.type === 'ERROR' ? '#fee2e2' : notif.type === 'WARNING' ? '#fef3c7' : '#dbeafe',
                            color: notif.type === 'SUCCESS' ? '#166534' : notif.type === 'ERROR' ? '#991b1b' : notif.type === 'WARNING' ? '#b45309' : '#1e40af'
                          }}>
                      {getTypeLabel(notif.type)}
                    </span>
                    {!notif.isRead && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
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
