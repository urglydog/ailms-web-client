'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    // TODO: Phase 1 Backend hasn't implemented WebSocket Config (STOMP/SockJS) yet.
    // When BE is ready, we will connect like this:
    /*
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev]);
    };

    return () => ws.close();
    */
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
