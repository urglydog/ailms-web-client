'use client';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef, useState } from 'react';
import { getAccessToken, decodeAccessToken } from '@/lib/auth/token';

export interface ChatMessage {
  /** Id THẬT của tin nhắn (server gán lúc lưu) — (20/09/2026, sửa lỗi) trước đây bị lẫn với id
   * người gửi, khiến nhiều tin GỐC cùng người gửi trong 1 phiên live trùng id, hỏng việc gom
   * nhóm câu trả lời theo `parentId`. */
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  timestamp: string;
  parentId?: string;
  /** true nếu người gửi là giảng viên sở hữu khóa học — dùng để gắn nhãn "Giảng viên". */
  isInstructor: boolean;
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

  const sendMessage = (content: string, senderName: string, parentId?: string) => {
    if (clientRef.current && clientRef.current.connected) {
      const decoded = decodeAccessToken();
      const senderId = decoded ? String(decoded.id) : '';
      if (!senderId) return;
      // id/timestamp/isInstructor do SERVER gán lúc lưu (xem ChatMessageDto) — client chỉ cần
      // gửi senderId/senderName/content/parentId, các field còn lại bị bỏ qua khi nhận vào.
      const payload: Record<string, string> = {
          senderId,
          content,
          senderName,
      };
      if (parentId) {
          payload.parentId = parentId;
      }
      clientRef.current.publish({
        destination: `/app/chat/${lessonId}`,
        body: JSON.stringify(payload),
      });
    }
  };

  return { messages, sendMessage };
}
