'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { toTutorMessage, tutorApi } from '@/lib/api/tutor';
import { ApiError } from '@/lib/api/client';
import type { TutorAttachment, TutorMessage } from '@/types/domain';

interface ActiveChat {
  sessionId: number | null;
  messages: TutorMessage[];
}

/** Đọc 1 `File` thành chuỗi base64 THUẦN (bỏ tiền tố `data:...;base64,`) — Gemini
 * `inlineData` cần đúng dạng này, không phải Data URL đầy đủ. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Không đọc được tệp'));
    reader.readAsDataURL(file);
  });
}

/**
 * UC30 mở rộng — hỏi đáp Gia sư AI Socratic, có lưu và phục hồi lịch sử trò chuyện kiểu
 * ChatGPT (trước đây chỉ giữ trong state cục bộ, tải lại trang là mất — dù `chat_messages`
 * vẫn còn nguyên trong DB, chỉ là FE chưa từng đọc lại). Có ghim/đổi tên/xoá cuộc trò chuyện.
 *
 * Ngay khi hook được dùng (trang bài học mount, không cần đợi mở panel), tự tải danh sách
 * phiên chat + phục hồi phiên GẦN NHẤT nếu có — vá đúng lỗi "load lại web là mất cuộc trò
 * chuyện".
 *
 * `sessionId` và `messages` GỘP CHUNG 1 state (`chat`) thay vì 2 `useState` tách rời — lúc đầu
 * tách rời gây đúng lỗi thực tế: `switchSession`/phục hồi gọi `setSessionId` rồi mới
 * `setMessages` ở 2 lượt render KHÁC NHAU (do có `await` chen giữa), khiến `TutorPanel` đọc được
 * `sessionId` MỚI nhưng `messages` vẫn CŨ ở lượt render đầu — component tưởng "chưa đổi phiên"
 * (do đã lỡ ghi nhận sessionId mới từ lượt trước) đúng lúc `messages` mới thực sự đổi, nên cuộn
 * MƯỢT (trượt dài) thay vì cuộn NGAY tới cuối. Gộp 1 state đảm bảo 2 giá trị luôn đổi CÙNG LÚC
 * trong đúng 1 lượt render.
 */
export function useTutorChat(lessonId: number) {
  const [chat, setChat] = useState<ActiveChat>({ sessionId: null, messages: [] });
  const [isRestoring, setIsRestoring] = useState(true);
  const queryClient = useQueryClient();
  const sessionsQueryKey = ['tutor', lessonId, 'sessions'] as const;

  const sessionsQuery = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () => tutorApi.listSessions(lessonId),
  });

  // Phục hồi phiên GẦN NHẤT đúng 1 lần khi danh sách phiên vừa tải xong — `chat.sessionId !==
  // null` là cờ chặn chạy lại (đã phục hồi rồi, hoặc học viên vừa tự chọn/tạo phiên khác).
  useEffect(() => {
    if (!sessionsQuery.data || chat.sessionId !== null) return;
    const latest = sessionsQuery.data[0];
    if (!latest) {
      setIsRestoring(false);
      return;
    }
    tutorApi
      .getMessages(lessonId, latest.id)
      .then((msgs) => setChat({ sessionId: latest.id, messages: msgs.map(toTutorMessage) }))
      .catch(() => {
        // Phuc hoi that bai (vd phien vua bi xoa) khong nghiem trong — coi nhu bat dau moi.
      })
      .finally(() => setIsRestoring(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chi chay lai khi CO du lieu sessions moi, khong phai moi lan chat doi
  }, [sessionsQuery.data, lessonId]);

  const mutation = useMutation({
    mutationFn: async ({ question, files }: { question: string; files: File[] }) => {
      const attachments = await Promise.all(
        files.map(async (f) => ({ fileName: f.name, dataBase64: await fileToBase64(f) })),
      );
      return tutorApi.ask(lessonId, { question, sessionId: chat.sessionId, attachments });
    },
    onMutate: ({ question, files }: { question: string; files: File[] }) => {
      // Xem truoc CUC BO bang blob URL — chi de hien thi ngay trong phien lam viec nay,
      // KHONG phai URL that tren B2 (chi co sau khi be/ upload xong va tra ve qua getMessages).
      const localAttachments: TutorAttachment[] = files.map((f, i) => ({
        id: `local-att-${Date.now()}-${i}`,
        fileName: f.name,
        previewUrl: URL.createObjectURL(f),
        mimeType: f.type,
      }));
      setChat((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: `local-${Date.now()}`, sender: 'USER', content: question, citedTimestamps: [], attachments: localAttachments },
        ],
      }));
    },
    onSuccess: (res) => {
      setChat((prev) => ({
        sessionId: res.sessionId,
        messages: [
          ...prev.messages,
          { id: `ai-${res.sessionId}-${prev.messages.length}`, sender: 'AI', content: res.answer, citedTimestamps: res.citedTimestamps, attachments: [] },
        ],
      }));
      // Cau hoi dau tien cua 1 phien moi doi tieu de tu "Cuoc tro chuyen moi" thanh ten that
      // (AI tu goi y) -> lam moi danh sach de lan sau mo lich su thay dung.
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError && err.isQuotaExceeded
          ? 'Bạn đã hỏi đủ số lượt trong hôm nay, quay lại vào ngày mai nhé.'
          : err instanceof ApiError
            ? err.message
            : 'Gia sư AI hiện không phản hồi được, thử lại sau ít phút.';
      toast.error(message);
    },
  });

  const switchSession = async (targetSessionId: number) => {
    if (targetSessionId === chat.sessionId) return;
    const msgs = await tutorApi.getMessages(lessonId, targetSessionId);
    setChat({ sessionId: targetSessionId, messages: msgs.map(toTutorMessage) });
  };

  const startNewChat = async () => {
    const session = await tutorApi.startNewSession(lessonId);
    setChat({ sessionId: session.id, messages: [] });
    void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  };

  const renameSession = async (targetSessionId: number, title: string) => {
    await tutorApi.renameSession(lessonId, targetSessionId, title);
    void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  };

  const togglePin = async (targetSessionId: number, pinned: boolean) => {
    try {
      await tutorApi.pinSession(lessonId, targetSessionId, pinned);
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không ghim được cuộc trò chuyện này.');
    }
  };

  const removeSession = async (targetSessionId: number) => {
    await tutorApi.deleteSession(lessonId, targetSessionId);
    // Xoa dung phien DANG MO -> ve trang thai rong, khong con gi de hien; chon phien khac
    // (hoac "cuoc tro chuyen moi") se tu load lai binh thuong qua switchSession/startNewChat.
    setChat((prev) => (prev.sessionId === targetSessionId ? { sessionId: null, messages: [] } : prev));
    void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  };

  return {
    messages: chat.messages,
    sendQuestion: (question: string, files: File[] = []) => mutation.mutate({ question, files }),
    isSending: mutation.isPending,
    isRestoring,
    sessions: sessionsQuery.data ?? [],
    activeSessionId: chat.sessionId,
    switchSession,
    startNewChat,
    renameSession,
    togglePin,
    removeSession,
  };
}
