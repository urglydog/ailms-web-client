'use client';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef } from 'react';
import { getAccessToken, decodeAccessToken } from '@/lib/auth/token';
import { toast } from 'sonner';

export function useNotificationSocket() {
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
}
