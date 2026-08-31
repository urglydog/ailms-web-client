'use client';

import { useChat, useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RequireLoginModal } from '@/components/live/RequireLoginModal';

/** Topic RIÊNG cho lệnh ẩn tin nhắn — tách khỏi topic chat mặc định (`lk.chat`) của
 * `useChat()` để không lẫn với luồng gửi/nhận tin nhắn thường. */
const HIDE_TOPIC = 'lms.live-chat-hide';

interface HidePayload {
  messageId: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * UC53/UC54 (F11.4) — chat live + kiểm duyệt, dùng thẳng cơ chế Chat/Data Messages có sẵn của
 * LiveKit (BR-LIVE-12): KHÔNG gọi API `be/` nào, không có lịch sử — `useChat()` chỉ giữ tin nhắn
 * trong phiên kết nối hiện tại, tải lại trang là mất (đúng thiết kế, không phải bug).
 *
 * BR-LIVE-02 chặn Guest gửi được thực thi Ở TẦNG SERVER LiveKit (token Guest không có
 * `canPublishData`, xem `LiveViewService.issueViewerToken`) — input khoá ở đây chỉ là UX, không
 * phải lớp bảo vệ duy nhất.
 *
 * BR-LIVE-10 kiểm duyệt: giảng viên phát lệnh ẩn qua kênh Data Message riêng (topic
 * `lms.live-chat-hide`), MỌI client tự lọc tin nhắn đó khỏi danh sách hiển thị cục bộ — không có
 * bảng CSDL nào lưu "tin nhắn đã ẩn" (không cần, vì bản thân tin nhắn cũng không được lưu).
 * Client chỉ áp dụng lệnh ẩn nếu người gửi có identity bắt đầu bằng `instructor-` — định danh này
 * do `be/` cấp qua JWT ký bởi `LIVEKIT_API_SECRET`, học viên không thể giả mạo được.
 */
export function LiveChatPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { chatMessages, send, isSending } = useChat();
  const { send: sendHide } = useDataChannel(HIDE_TOPIC, (msg) => {
    if (!msg.from?.identity?.startsWith('instructor-')) return; // không phải giảng viên — bỏ qua
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload)) as HidePayload;
      setHiddenIds((prev) => new Set(prev).add(payload.messageId));
    } catch {
      // payload hỏng — bỏ qua, không phải lỗi nghiêm trọng
    }
  });
  const { localParticipant } = useLocalParticipant();
  const canModerate = localParticipant.identity.startsWith('instructor-');

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleMessages = chatMessages.filter((m) => !hiddenIds.has(m.id));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [visibleMessages.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const text = draft.trim();
    if (!text) return;
    void send(text);
    setDraft('');
  };

  const handleHide = (messageId: string) => {
    setHiddenIds((prev) => new Set(prev).add(messageId));
    void sendHide(new TextEncoder().encode(JSON.stringify({ messageId } satisfies HidePayload)), {
      reliable: true,
    });
  };

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <span className="text-[13px] font-bold text-gray-900">Chat trực tiếp</span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
        {visibleMessages.length === 0 && (
          <p className="text-center text-[12.5px] text-gray-400">Chưa có tin nhắn nào.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {visibleMessages.map((m) => {
            const senderIsInstructor = m.from?.identity?.startsWith('instructor-') ?? false;
            return (
              <div key={m.id} className="group flex items-start justify-between gap-2 text-[13px]">
                <p className="min-w-0 break-words text-gray-800">
                  <span className={`font-semibold ${senderIsInstructor ? 'text-red-600' : 'text-gray-900'}`}>
                    {senderIsInstructor ? 'Giảng viên' : (m.from?.name ?? 'Ẩn danh')}
                  </span>{' '}
                  <span className="text-[10.5px] text-gray-400">{formatTime(m.timestamp)}</span>
                  <br />
                  {m.message}
                </p>
                {canModerate && (
                  <button
                    type="button"
                    onClick={() => handleHide(m.id)}
                    title="Ẩn tin nhắn này"
                    className="shrink-0 text-[11px] text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                  >
                    Ẩn
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={!isAuthenticated}
          onFocus={() => {
            if (!isAuthenticated) setShowLoginModal(true);
          }}
          placeholder={isAuthenticated ? 'Nhập tin nhắn…' : 'Đăng nhập để chat'}
          className="min-w-0 flex-1 rounded-full border border-gray-200 px-3.5 py-2 text-[13px]
                     text-gray-800 outline-none placeholder:text-gray-400 focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={isAuthenticated && (isSending || !draft.trim())}
          className="shrink-0 rounded-full bg-cyan-600 px-4 py-2 text-[12.5px] font-bold text-white
                     hover:bg-cyan-700 disabled:opacity-50"
        >
          Gửi
        </button>
      </form>

      <RequireLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        actionLabel="gửi tin nhắn trong buổi live"
      />
    </div>
  );
}
