'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { tutorApi } from '@/lib/api/tutor';
import { ApiError } from '@/lib/api/client';
import type { TutorMessage } from '@/types/domain';

/**
 * UC30 — hỏi đáp Gia sư AI Socratic cho một bài học.
 *
 * Lịch sử tin nhắn chỉ giữ trong state cục bộ (không cache React Query phức tạp) —
 * khớp tính chất "HTTP đồng bộ" của Tutor: mỗi câu hỏi độc lập, không cần chia sẻ
 * giữa nhiều nơi trong UI, mất khi rời trang là chấp nhận được cho MVP F8.1.
 */
export function useTutorChat(lessonId: number) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (question: string) => tutorApi.ask(lessonId, { question, sessionId }),
    onMutate: (question: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, sender: 'USER', content: question, citedTimestamps: [] },
      ]);
    },
    onSuccess: (res) => {
      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${res.sessionId}-${prev.length}`, sender: 'AI', content: res.answer, citedTimestamps: res.citedTimestamps },
      ]);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError && err.isQuotaExceeded
          ? 'Bạn đã hỏi đủ số lượt trong hôm nay, quay lại vào ngày mai nhé.'
          : 'Gia sư AI hiện không phản hồi được, thử lại sau ít phút.';
      toast.error(message);
    },
  });

  return {
    messages,
    sendQuestion: (question: string) => mutation.mutate(question),
    isSending: mutation.isPending,
  };
}
