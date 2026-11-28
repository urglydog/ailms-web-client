'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommunitySocket, ChatMessage } from '@/hooks/useCommunitySocket';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('community.chat');
  const { messages, sendMessage, setBestAnswer } = useCommunitySocket(lessonId);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      toast.error(t('ownReply'));
      return;
    }
    // Giữ cấu trúc 1 cấp: Nếu reply 1 reply khác, ta gán parentId bằng parent gốc
    const parentId = msg.parentId || msg.id;
    const parentMsg = messages.find(m => m.id === parentId) || msg;
    setReplyingTo(parentMsg);
    setInputValue(`@${msg.senderName} `);
    inputRef.current?.focus();
  };

  /** Người hỏi hoặc giảng viên khoá mới được chọn câu trả lời hay nhất (BE kiểm tra lại). */
  const isCourseInstructor = !!currentUserId && messages.some((m) => m.isInstructor && m.senderId === currentUserId);
  const canMarkBest = (root: ChatMessage) => !!currentUserId && (root.senderId === currentUserId || isCourseInstructor);

  const toggleBest = (root: ChatMessage, reply: ChatMessage) => {
    const next = root.bestAnswerId === reply.id ? null : reply.id;
    setBestAnswer(root.id, next).catch(() => toast.error(t('bestError')));
  };

  const showMoreReplies = (rootId: string) => {
    setVisibleCounts(prev => ({ ...prev, [rootId]: (prev[rootId] ?? 0) + REPLIES_PAGE_SIZE }));
  };

  const repliesByParent = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    if (msg.parentId) {
      const arr = acc[msg.parentId] || [];
      arr.push(msg);
      acc[msg.parentId] = arr;
    }
    return acc;
  }, {});

  /** Câu trả lời (replies) xếp CŨ NHẤT lên trên để đọc hội thoại xuôi dòng; câu hay nhất ghim đầu. */
  const orderReplies = (replies: ChatMessage[], bestId?: string | null): ChatMessage[] => {
    return replies.slice().sort((a, b) => {
      if (bestId && (a.id === bestId) !== (b.id === bestId)) return a.id === bestId ? -1 : 1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  };

  /** Câu hỏi gốc (root) xếp MỚI NHẤT lên trên. */
  const rootMessages = messages
    .filter(m => !m.parentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const renderMessage = (msg: ChatMessage, isReply: boolean = false, root?: ChatMessage) => {
    const isBest = !!root && root.bestAnswerId === msg.id;
    return (
    <div key={msg.id} className={`flex items-start gap-3 ${isReply ? 'mt-4' : 'border-b border-line-soft pb-4'}`}>
      <Avatar name={msg.senderName} avatarUrl={msg.senderAvatarUrl} size={isReply ? 28 : 36} />
      <div className="flex min-w-0 flex-col flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-ink">{msg.senderName}</span>
          {msg.isInstructor && (
            <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-surface">
              {t('instructor')}
            </span>
          )}
          {isBest && (
            <span className="rounded-full bg-success-tint px-2 py-0.5 text-[10.5px] font-bold text-success-ink">
              {t('bestAnswer')}
            </span>
          )}
          <span className="text-[12px] text-ink-muted">
            {new Date(msg.timestamp).toLocaleDateString('vi-VN', { month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
        </div>
        <p className="text-[14px] text-ink mt-1 whitespace-pre-wrap leading-relaxed">
          {msg.content}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleReplyClick(msg)}
            className="text-[13px] text-accent font-medium w-fit hover:underline"
          >
            {t('reply')}
          </button>
          {isReply && root && canMarkBest(root) && (
            <button
              type="button"
              onClick={() => toggleBest(root, msg)}
              aria-pressed={isBest}
              className="text-[13px] font-medium text-ink-muted w-fit hover:text-success-ink hover:underline"
            >
              {isBest ? t('unmarkBest') : t('markBest')}
            </button>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-ink text-lg">{t('title')}</h3>
        <form onSubmit={handleSend} className="flex flex-col border border-line rounded-lg focus-within:border-accent overflow-hidden">
          {replyingTo && (
            <div className="px-3 py-2 bg-surface-raised text-xs text-ink-muted flex justify-between items-center border-b border-line">
              <span>{t.rich('replyingTo', { name: replyingTo.senderName, b: (chunks) => <strong>{chunks}</strong> })}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setInputValue('');
                }}
                className="text-danger hover:underline font-semibold"
              >
                {t('cancel')}
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={replyingTo ? t('replyPlaceholder') : t('placeholder')}
            className="w-full text-sm bg-surface border-none focus:ring-0 p-3 min-h-[80px] resize-y outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
          />
          <div className="flex justify-end p-2 bg-surface border-t border-line-soft">
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-accent text-white px-5 py-1.5 rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-accent-strong"
            >
              {t('send')}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-5">
        {rootMessages.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-sm text-ink-muted text-center bg-surface-raised rounded-xl">
            <span className="text-3xl mb-2" aria-hidden>💬</span>
            {t('empty')}<br/>{t('emptyHint')}
          </div>
        ) : (
          rootMessages.map((msg) => {
            const orderedReplies = orderReplies(repliesByParent[msg.id] || [], msg.bestAnswerId);
            const visibleCount = visibleCounts[msg.id] ?? Math.min(REPLIES_PAGE_SIZE, orderedReplies.length);
            const visibleReplies = orderedReplies.slice(0, visibleCount);
            const hasMore = visibleCount < orderedReplies.length;

            return (
              <div key={msg.id} className="flex flex-col">
                {renderMessage(msg)}

                {orderedReplies.length > 0 && (
                  <div className="ml-10 mt-1 flex flex-col pl-4 border-l-2 border-line-soft">
                    {visibleReplies.map(reply => renderMessage(reply, true, msg))}
                    {hasMore && (
                      <button
                        onClick={() => showMoreReplies(msg.id)}
                        className="w-fit text-[13px] font-semibold text-accent hover:underline mt-3"
                      >
                        {t('showMore', { count: orderedReplies.length - visibleCount })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
