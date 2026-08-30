import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { TutorAskReq, TutorAskRes, TutorMessage, TutorSession } from '@/types/domain';

interface RawMessageAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

interface RawMessage {
  id: number;
  sender: 'USER' | 'AI';
  content: string;
  citedTimestamps: number[];
  attachments: RawMessageAttachment[];
}

export const tutorApi = {
  /** UC30 — hỏi Gia sư AI Socratic, HTTP đồng bộ (không qua WebSocket). */
  ask: (lessonId: number, req: TutorAskReq) =>
    api.post<TutorAskRes>(`/api/v1/lessons/${lessonId}/tutor/ask`, req, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — danh sách cuộc trò chuyện đã có với bài học này, mới nhất trước. */
  listSessions: (lessonId: number) =>
    api.get<TutorSession[]>(`/api/v1/lessons/${lessonId}/tutor/sessions`, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — phục hồi lại toàn bộ tin nhắn của 1 cuộc trò chuyện cũ. */
  getMessages: (lessonId: number, sessionId: number) =>
    api.get<RawMessage[]>(`/api/v1/lessons/${lessonId}/tutor/sessions/${sessionId}/messages`, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — bắt đầu 1 cuộc trò chuyện mới (khác phiên gần nhất). */
  startNewSession: (lessonId: number) =>
    api.post<TutorSession>(`/api/v1/lessons/${lessonId}/tutor/sessions`, undefined, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — đổi tên thủ công, ghi đè vĩnh viễn (AI không tự đặt lại tên nữa). */
  renameSession: (lessonId: number, sessionId: number, title: string) =>
    api.patch<void>(`/api/v1/lessons/${lessonId}/tutor/sessions/${sessionId}`, { title }, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — ghim/bỏ ghim (tối đa 5 mục ghim cùng lúc, backend tự chặn). */
  pinSession: (lessonId: number, sessionId: number, pinned: boolean) =>
    api.patch<void>(`/api/v1/lessons/${lessonId}/tutor/sessions/${sessionId}/pin`, { pinned }, {
      token: getAccessToken() ?? undefined,
    }),
  /** UC30 mở rộng — xoá hẳn 1 cuộc trò chuyện. */
  deleteSession: (lessonId: number, sessionId: number) =>
    api.delete<void>(`/api/v1/lessons/${lessonId}/tutor/sessions/${sessionId}`, {
      token: getAccessToken() ?? undefined,
    }),
};

/** Chuyển tin nhắn BE trả về (`getMessages`) thành `TutorMessage` FE dùng để render. */
export function toTutorMessage(m: RawMessage): TutorMessage {
  return {
    id: String(m.id),
    sender: m.sender,
    content: m.content,
    citedTimestamps: m.citedTimestamps,
    attachments: m.attachments.map((a) => ({
      id: String(a.id),
      fileName: a.fileName,
      previewUrl: a.fileUrl,
      mimeType: a.mimeType,
    })),
  };
}
