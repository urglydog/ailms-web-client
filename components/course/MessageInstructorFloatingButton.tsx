'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversationMessages, useConversations, useSendMessage, useStartConversationAsStudent } from '@/hooks/useCommunication';
import { Avatar } from '@/components/ui/Avatar';

/** Tự ẩn nhãn xem trước tin nhắn mới sau chừng này (ms) nếu không ai hover vào. */
const PREVIEW_AUTO_HIDE_MS = 6000;

/**
 * (20/09/2026, tính năng mới; sửa theo phản hồi) — biểu tượng tin nhắn nổi, GHIM cố định góc
 * phải-dưới trang học bài. Ban đầu điều hướng sang trang `/messages` riêng, theo phản hồi đổi
 * thành 1 CỬA SỔ NỔI ngay tại chỗ (không rời trang) — tái dùng đúng API/hook đã có
 * (`useConversationMessages`/`useSendMessage`, cùng khuôn `MessagesInbox.tsx`), chỉ bỏ khung 2
 * cột (danh sách hội thoại) vì ở đây LUÔN đúng 1 hội thoại: với giảng viên của khóa đang học.
 *
 * (20/09/2026, mở rộng) — số tin chưa đọc lấy từ {@link useConversations} (đã có sẵn
 * `unreadCount`/`otherUserAvatarUrl` — không cần API riêng), khớp theo `courseId` để hiện được
 * badge NGAY CẢ KHI chưa từng bấm mở khung chat (hội thoại có thể đã tồn tại từ trước).
 *
 * (20/09/2026, theo phản hồi) — bỏ toast alert khi có tin nhắn mới (xem `NotificationProvider`),
 * thay bằng nhãn xem trước kiểu Messenger cạnh icon: tự hiện khi `unreadCount` tăng, tự tắt sau
 * {@link PREVIEW_AUTO_HIDE_MS}, hiện lại khi hover vào cả icon lẫn chính nhãn. Nhãn tự co giãn
 * theo độ dài tin nhắn nhưng bị chặn ở `max-w` — `truncate` tự thêm "..." khi vượt quá.
 */
export function MessageInstructorFloatingButton({ courseId }: { courseId: number }) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hovering, setHovering] = useState(false);
  const startConversation = useStartConversationAsStudent();
  const { data: conversations } = useConversations();

  const conversation = conversations?.find((c) => c.courseId === courseId) ?? null;
  const unreadCount = conversation?.unreadCount ?? 0;

  const prevUnreadRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && !open) {
      setShowPreview(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowPreview(false), PREVIEW_AUTO_HIDE_MS);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, open]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleToggle = () => {
    setShowPreview(false);
    if (open) {
      setOpen(false);
      return;
    }
    const existingId = conversationId ?? conversation?.id ?? null;
    if (existingId) {
      setConversationId(existingId);
      setOpen(true);
      return;
    }
    startConversation.mutate(courseId, {
      onSuccess: (started) => {
        setConversationId(started.id);
        setOpen(true);
      },
    });
  };

  const previewVisible = !open && conversation?.lastMessagePreview && (showPreview || hovering);

  return (
    <>
      {open && conversationId && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[440px] w-[340px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            {conversation && <Avatar name={conversation.otherUserName} avatarUrl={conversation.otherUserAvatarUrl} size={28} />}
            <span className="flex-1 truncate font-display text-[14px] font-bold text-ink">
              {conversation?.otherUserName ?? 'Nhắn tin giảng viên'}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="text-lg text-ink-muted hover:text-ink"
            >
              ×
            </button>
          </div>
          <FloatingConversationThread conversationId={conversationId} />
        </div>
      )}

      <div
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {previewVisible && conversation && (
          <button
            type="button"
            onClick={handleToggle}
            className="flex max-w-[240px] items-center gap-2 rounded-2xl border border-line bg-white py-2 pl-2 pr-3 text-left shadow-lg transition-shadow hover:shadow-xl"
          >
            <Avatar name={conversation.otherUserName} avatarUrl={conversation.otherUserAvatarUrl} size={30} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[12px] font-bold text-ink">{conversation.otherUserName}</span>
              <span className="truncate text-[12px] text-ink-muted">{conversation.lastMessagePreview}</span>
            </span>
          </button>
        )}

        <button
          type="button"
          title="Nhắn tin giảng viên"
          aria-label="Nhắn tin giảng viên"
          disabled={startConversation.isPending}
          onClick={handleToggle}
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {startConversation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : open ? (
            <span className="text-2xl leading-none">×</span>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          {!open && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

/** Khoảng cách (px) tính từ đáy coi như "đang ở cuối" — chừa dư 1 chút vì trình duyệt làm tròn
 * số thập phân của scrollHeight/scrollTop khác nhau. */
const BOTTOM_THRESHOLD_PX = 24;

function FloatingConversationThread({ conversationId }: { conversationId: number }) {
  const { data: messages, isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const [newCount, setNewCount] = useState(0);
  const prevLengthRef = useRef<number | null>(null);

  // `getMessages` (BE) tự đánh dấu đã đọc ngay khi mở — làm mới badge số tin chưa đọc trên nút
  // nổi NGAY thay vì đợi tới lượt poll 15s tiếp theo của `useConversations`.
  useEffect(() => {
    if (!isLoading) {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    }
  }, [isLoading, queryClient]);

  const isScrollAtBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
  };

  const updateAtBottom = (atBottom: boolean) => {
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  };

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  /**
   * (20/09/2026, tính năng mới) — mở lại khung chat vẫn giữ ĐÚNG vị trí đang đọc thay vì tự
   * nhảy xuống cuối: chỉ tự cuộn xuống khi (a) vừa tải xong lần đầu, hoặc (b) người xem ĐANG ở
   * cuối lúc tin nhắn mới về (giữ cảm giác "theo dõi" tự nhiên của chat). Nếu đang đọc tin cũ
   * (đã cuộn lên) thì GIỮ NGUYÊN vị trí, chỉ cộng dồn số tin mới vào nút cuộn xuống.
   */
  useEffect(() => {
    if (!messages) return;
    const prevLength = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (prevLength === null) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        updateAtBottom(true);
      });
      return;
    }

    const added = messages.length - prevLength;
    if (added <= 0) return;

    if (isAtBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      setNewCount((n) => n + added);
    }
  }, [messages]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage.mutate(
      { conversationId, content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
          // Gửi tin của CHÍNH MÌNH luôn cuộn xuống xem ngay, bất kể trước đó đang đọc tin cũ.
          requestAnimationFrame(() => {
            scrollToBottom('smooth');
            updateAtBottom(true);
          });
        },
      },
    );
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom('smooth');
    updateAtBottom(true);
  };

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={() => updateAtBottom(isScrollAtBottom())}
          className="h-full overflow-y-auto p-3"
        >
          {isLoading && <p className="text-center text-[12.5px] text-ink-muted">Đang tải...</p>}
          {!isLoading && messages?.length === 0 && (
            <p className="text-center text-[12.5px] text-ink-muted">Chưa có tin nhắn nào — gửi câu hỏi đầu tiên nhé!</p>
          )}
          <div className="flex flex-col gap-2">
            {messages?.map((m) => (
              <div key={m.id} className={`flex items-end gap-1.5 ${m.mine ? 'flex-row-reverse' : ''}`}>
                <Avatar name={m.senderName} avatarUrl={m.senderAvatarUrl} size={22} />
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-[12.5px] ${
                    m.mine ? 'bg-accent text-white' : 'bg-surface-hover text-ink'
                  }`}
                >
                  {m.content}
                  <div className={`mt-1 text-[10px] ${m.mine ? 'text-white/70' : 'text-ink-faint'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isAtBottom && (
          <button
            type="button"
            onClick={handleScrollToBottomClick}
            aria-label="Cuộn xuống tin nhắn mới nhất"
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md hover:bg-surface-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            {newCount > 0 && (
              <span className="absolute -top-2 -right-1.5 flex min-w-[19px] h-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-bold text-white">
                {newCount > 99 ? '99' : newCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line p-2.5">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-lg border border-line px-3 py-2 text-[12.5px] focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || sendMessage.isPending}
          className="shrink-0 rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </>
  );
}
