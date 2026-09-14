'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken, decodeAccessToken } from '@/lib/auth/token';
import { toast } from 'sonner';

type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Dummy data for Phase 1 UI structure
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: 'Chào mừng bạn',
        message: 'Chào mừng bạn đến với LinguaLearn!',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);
  }, []);

  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    
    const user = decodeAccessToken();
    const email = user?.sub;
    if (!email) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${email}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          
          setNotifications(prev => [{
            id: Date.now(),
            title: data.type === 'SRS_REMINDER' ? '📚 Ôn tập Flashcard' : 'Thông báo mới',
            message: data.message,
            isRead: false,
            createdAt: new Date().toISOString()
          }, ...prev]);

          if (data.type === 'SRS_REMINDER' && data.message) {
            toast.info(data.message, {
              duration: 10000,
              icon: '📚'
            });
          } else if (data.message) {
            toast.info(data.message);
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
