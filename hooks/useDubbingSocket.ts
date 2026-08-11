'use client';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth/token';
import type { DubbingProgressEvent } from '@/types/domain';

/**
 * UC20 — kết nối STOMP qua SockJS, subscribe `/topic/dubbing/{lessonId}` để nhận tiến độ
 * lồng tiếng realtime. Kênh này KHÔNG mang dữ liệu riêng tư (chỉ % tiến độ) nên backend chưa
 * xác thực CONNECT frame (xem javadoc `WebSocketConfig`) — vẫn gửi kèm Bearer token cho nhất
 * quán với quy ước REST của cả dự án, để bật xác thực sau này không phải sửa gì ở FE.
 *
 * Chỉ kết nối khi `lessonId` khác null — dùng đúng lúc `mode === 'processing'` ở trang học.
 */
export function useDubbingSocket(lessonId: number | null) {
  const [lastEvent, setLastEvent] = useState<DubbingProgressEvent | null>(null);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (lessonId == null) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/dubbing/${lessonId}`, (message) => {
        try {
          setLastEvent(JSON.parse(message.body) as DubbingProgressEvent);
        } catch {
          // Bỏ qua message không phải JSON hợp lệ — không làm crash UI vì 1 message hỏng.
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

  return { lastEvent };
}
