'use client';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef, useState } from 'react';
import { getAccessToken, decodeAccessToken } from '@/lib/auth/token';

export interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export function useCommunitySocket(lessonId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (lessonId == null) return;

    // Fetch history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/lessons/${lessonId}/chats`, {
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ''}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };
    fetchHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/lesson/${lessonId}/chat`, (message) => {
        try {
          const msg = JSON.parse(message.body) as ChatMessage;
          setMessages((prev) => [...prev, msg]);
        } catch {
          // Ignore invalid messages
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [lessonId]);

  const sendMessage = (content: string, senderName: string) => {
    if (clientRef.current && clientRef.current.connected) {
      const decoded = decodeAccessToken();
      const userId = decoded ? String(decoded.id) : crypto.randomUUID();
      clientRef.current.publish({
        destination: `/app/chat/${lessonId}`,
        body: JSON.stringify({ 
          id: userId, 
          content, 
          senderName, 
          timestamp: new Date().toISOString() 
        }),
      });
    }
  };

  return { messages, sendMessage };
}
