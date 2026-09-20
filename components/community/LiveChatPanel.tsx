'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommunitySocket, ChatMessage } from '@/hooks/useCommunitySocket';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';

interface LiveChatPanelProps {
  lessonId: number;
  userName: string;
  /** (20/09/2026, tính năng mới) — id người dùng hiện tại, dùng để chặn tự trả lời chính mình
   * bằng ID thật thay vì so tên hiển thị (2 người có thể trùng tên). */
  currentUserId?: string;
}

const REPLIES_PAGE_SIZE = 3;

/**
 * (20/09/2026, thiết kế lại — kiểu bình luận Facebook) — trước đây danh sách câu trả lời chỉ có
 * 2 trạng thái "ẩn hết" / "hiện hết", không phân biệt giảng viên, không phân trang. Giờ:
 *   1. Câu trả lời ĐẦU TIÊN của giảng viên (nếu có) luôn ghim lên đầu, có nhãn "Giảng viên".
 *   2. Các câu trả lời còn lại (kể cả câu trả lời khác của giảng viên) xếp MỚI NHẤT lên trên.
 *   3. Chỉ hiện {@link REPLIES_PAGE_SIZE} câu ban đầu, nút "Xem thêm" tải thêm từng đợt, tự ẩn
 *      khi đã hiện hết — không còn nút "Ẩn bớt" gộp chung nữa (đúng khuôn phân trang comment).
 */
export function LiveChatPanel({ lessonId, userName, currentUserId }: LiveChatPanelProps) {
  const { messages, sendMessage } = useCommunitySocket(lessonId);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    sendMessage(inputValue.trim(), userName, replyingTo?.id);

    setInputValue('');
    setReplyingTo(null);
  };

  const handleReplyClick = (msg: ChatMessage) => {
    if (currentUserId ? msg.senderId === currentUserId : msg.senderName === userName) {
      toast.error('Bạn không thể trả lời tin nhắn của chính mình!');
      return;
    }
    // Giữ cấu trúc 1 cấp: Nếu reply 1 reply khác, ta gán parentId bằng parent gốc
    const parentId = msg.parentId || msg.id;
    const parentMsg = messages.find(m => m.id === parentId) || msg;
    setReplyingTo(parentMsg);
    setInputValue(`@${msg.senderName} `);
    inputRef.current?.focus();
  };

  const showMoreReplies = (rootId: string) => {
    setVisibleCounts(prev => ({ ...prev, [rootId]: (prev[rootId] ?? 0) + REPLIES_PAGE_SIZE }));
  };

  const rootMessages = messages.filter(m => !m.parentId);
  const repliesByParent = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    if (msg.parentId) {
      const arr = acc[msg.parentId] || [];
      arr.push(msg);
      acc[msg.parentId] = arr;
    }
    return acc;
  }, {});

  /** Ghim câu trả lời ĐẦU TIÊN của giảng viên lên đầu, phần còn lại mới nhất lên trên. */
  const orderReplies = (replies: ChatMessage[]): ChatMessage[] => {
    const firstInstructorReply = replies.find(r => r.isInstructor);
    const rest = replies
      .filter(r => r.id !== firstInstructorReply?.id)
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return firstInstructorReply ? [firstInstructorReply, ...rest] : rest;
  };

  const renderMessage = (msg: ChatMessage, isReply: boolean = false) => (
    <div key={msg.id} className={`flex items-start gap-2 ${isReply ? 'ml-2' : ''}`}>
      <Avatar name={msg.senderName} avatarUrl={msg.senderAvatarUrl} size={28} />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-ink">{msg.senderName}</span>
          {msg.isInstructor && (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
              Giảng viên
            </span>
          )}
          <span className="text-[11px] text-ink-faint">
            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => handleReplyClick(msg)}
            className="text-[11px] text-accent hover:underline ml-1 font-semibold whitespace-nowrap shrink-0"
          >
            Trả lời
          </button>
        </div>
        <p className="text-sm text-ink leading-snug bg-surface border border-line-soft rounded-lg rounded-tl-none p-2 w-fit">
          {msg.content}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px] border border-line rounded-xl bg-surface overflow-hidden">
      <div className="bg-surface-hover px-4 py-3 border-b border-line flex items-center justify-between">
        <h3 className="font-semibold text-ink">Hỏi đáp Bài học</h3>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Online
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth"
      >
        {rootMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-ink-muted text-center">
            Chưa có tin nhắn nào.<br/>Hãy là người đầu tiên đặt câu hỏi!
          </div>
        ) : (
          rootMessages.map((msg) => {
            const orderedReplies = orderReplies(repliesByParent[msg.id] || []);
            const visibleCount = visibleCounts[msg.id] ?? Math.min(REPLIES_PAGE_SIZE, orderedReplies.length);
            const visibleReplies = orderedReplies.slice(0, visibleCount);
            const hasMore = visibleCount < orderedReplies.length;

            return (
              <div key={msg.id} className="flex flex-col">
                {renderMessage(msg)}

                {orderedReplies.length > 0 && (
                  <div className="ml-8 mt-2 flex flex-col gap-3 border-l-2 border-line-soft pl-3">
                    {visibleReplies.map(reply => renderMessage(reply, true))}
                    {hasMore && (
                      <button
                        onClick={() => showMoreReplies(msg.id)}
                        className="w-fit text-[12px] font-semibold text-ink-muted hover:text-ink"
                      >
                        Xem thêm {orderedReplies.length - visibleCount} câu trả lời
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-surface-hover border-t border-line flex flex-col">
        {replyingTo && (
          <div className="px-3 py-2 bg-line-soft text-xs text-ink-muted flex justify-between items-center border-b border-line">
            <span>Đang trả lời <strong>{replyingTo.senderName}</strong></span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setInputValue('');
              }}
              className="text-red-500 hover:underline font-semibold"
            >
              Hủy
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="p-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={replyingTo ? "Nhập câu trả lời..." : "Nhập câu hỏi hoặc thảo luận..."}
            className="flex-1 min-w-0 text-sm bg-surface border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="shrink-0 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
