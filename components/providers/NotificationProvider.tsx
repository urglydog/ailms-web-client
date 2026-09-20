'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken, decodeAccessToken } from '@/lib/auth/token';
import { notificationApi } from '@/lib/api/notifications';
import { toast } from 'sonner';

type Notification = {
  id: number;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  type?: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * (20/09/2026, sửa lỗi) — trước đây dropdown chuông chỉ hiện 1 dòng "Chào mừng bạn" giả lập,
 * KHÔNG gọi `GET /api/v1/notifications` nên mất hết lịch sử đã lưu (vi phạm BR-NOTIFY-01: mọi
 * sự kiện phải lưu DB để xem lại được). Tin nhắn/thông báo thật đến qua WebSocket cũng hiển thị
 * rỗng vì đọc field `data.message` không tồn tại (BE trả `content`) và tiêu đề bị GHI ĐÈ cứng
 * thành "Thông báo mới" thay vì `data.title` thật — xem lịch sử trao đổi.
 *
 * Riêng `SRS_REMINDER` (nhắc ôn Flashcard, `FlashcardNotificationJob`) vẫn bắn payload dạng Map
 * thô KHÔNG qua `NotificationService.notify()` (không lưu DB, không có `title`/`content`) — giữ
 * nhánh xử lý riêng cho đúng loại này, không phải bug ở đây.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!getAccessToken()) return;
    notificationApi.listMine()
      .then((data) => setNotifications(data))
      .catch(() => {
        // best-effort — dropdown vẫn dùng được, chỉ thiếu lịch sử cũ nếu API lỗi
      });
  }, []);

  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const user = decodeAccessToken();
    const userId = user?.id;
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${userId}`, (message) => {
        try {
          const data = JSON.parse(message.body);

          if (data.type === 'SRS_REMINDER') {
            setNotifications(prev => [{
              id: Date.now(),
              title: '📚 Ôn tập Flashcard',
              content: data.message ?? '',
              linkUrl: null,
              isRead: false,
              createdAt: new Date().toISOString(),
              type: data.type,
            }, ...prev]);
            if (data.message) {
              toast.info(data.message, { duration: 10000, icon: '📚' });
            }
            return;
          }

          // Payload thật từ NotificationService.notify() — NotificationRes đầy đủ.
          setNotifications(prev => [{
            id: data.id ?? Date.now(),
            title: data.title ?? 'Thông báo mới',
            content: data.content ?? '',
            linkUrl: data.linkUrl ?? null,
            isRead: false,
            createdAt: data.createdAt ?? new Date().toISOString(),
            type: data.type,
          }, ...prev]);

          // (20/09/2026, theo phản hồi) — tin nhắn mới KHÔNG hiện toast nữa, đã có nhãn xem
          // trước kiểu Messenger cạnh icon chat nổi (`MessageInstructorFloatingButton.tsx`).
          // Các loại thông báo khác vẫn giữ toast như cũ.
          if (data.title && data.type !== 'NEW_MESSAGE') {
            toast.info(data.title, { description: data.content || undefined });
          }
        } catch {
          // Ignore invalid message
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
