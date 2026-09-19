'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SearchIcon, SendIcon } from '@/components/instructor/SidebarIcons';
import { useConversationMessages, useConversations, useSendMessage } from '@/hooks/useCommunication';

type SortOption = 'newest' | 'oldest';

/**
 * Hộp thư 2 cột (danh sách hội thoại / nội dung tin nhắn) dùng chung cho cả 2 phía học viên và
 * giảng viên (19/09/2026, tính năng mới) — API `ConversationRes`/`MessageRes` đã chuẩn hoá theo
 * góc nhìn "mình"/"người kia" (`mine`, `otherUserName`) nên UI không cần biết đang là vai trò
 * nào. `composeSlot` là chỗ cắm nút "Soạn tin nhắn" riêng của Giảng viên (chọn khóa → học viên).
 */
export function MessagesInbox({
  composeSlot,
  initialConversationId,
}: {
  composeSlot?: ReactNode;
  /** Mở sẵn 1 hội thoại cụ thể (vd đến từ nút "Nhắn tin giảng viên" ở trang khóa học). */
  initialConversationId?: number | null;
}) {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<number | null>(initialConversationId ?? null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const first = conversations?.[0];
    if (!selectedId && first) {
      setSelectedId(first.id);
    }
  }, [conversations, selectedId]);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;

  const visibleConversations = useMemo(() => {
    const list = conversations ?? [];
    const filtered = search.trim()
      ? list.filter(
          (c) =>
            c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
            (c.lastMessagePreview ?? '').toLowerCase().includes(search.toLowerCase()),
        )
      : list;
    const sorted = [...filtered].sort((a, b) => new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime());
    return sort === 'newest' ? sorted.reverse() : sorted;
  }, [conversations, search, sort]);

  return (
    <div className="grid h-[calc(100vh-180px)] min-h-[480px] grid-cols-[300px_1fr] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col border-r border-gray-100">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-3">
          <span className="font-display text-[14px] font-bold text-gray-900">Hội thoại</span>
          {composeSlot}
        </div>
        <div className="flex items-center gap-1.5 border-b border-gray-100 p-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5">
            <SearchIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, nội dung..."
              className="w-full text-[12.5px] outline-none"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              title="Sắp xếp"
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
            >
              {sort === 'newest' ? 'Mới nhất' : 'Cũ nhất'} ▾
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {(['newest', 'oldest'] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { setSort(option); setShowSortMenu(false); }}
                      className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${sort === option ? 'font-bold text-cyan-700' : 'text-gray-700'}`}
                    >
                      {option === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="p-4 text-center text-[13px] text-gray-500">Đang tải...</p>}
          {!isLoading && visibleConversations.length === 0 && (
            <p className="p-4 text-center text-[13px] text-gray-500">
              {conversations && conversations.length > 0 ? 'Không tìm thấy hội thoại phù hợp.' : 'Chưa có hội thoại nào.'}
            </p>
          )}
          {visibleConversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full flex-col gap-0.5 border-b border-gray-50 px-3 py-2.5 text-left transition-colors ${
                selectedId === c.id ? 'bg-cyan-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold text-gray-900">{c.otherUserName}</span>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {c.unreadCount > 9 ? '9+' : c.unreadCount}
                  </span>
                )}
              </div>
              {c.courseTitle && <span className="truncate text-[11px] text-gray-400">{c.courseTitle}</span>}
              {c.lastMessagePreview && (
                <span className="truncate text-[12px] text-gray-500">{c.lastMessagePreview}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-gray-400">
            Chọn 1 hội thoại để xem tin nhắn
          </div>
        ) : (
          <ConversationThread conversationId={selected.id} otherUserName={selected.otherUserName} />
        )}
      </div>
    </div>
  );
}

function ConversationThread({ conversationId, otherUserName }: { conversationId: number; otherUserName: string }) {
  const { data: messages, isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage.mutate({ conversationId, content: content.trim() }, { onSuccess: () => setContent('') });
  };

  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3">
        <span className="font-display text-[14px] font-bold text-gray-900">{otherUserName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-center text-[13px] text-gray-500">Đang tải...</p>}
        <div className="flex flex-col gap-2">
          {messages?.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-xl px-3 py-2 text-[13px] ${
                  m.mine ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.content}
                <div className={`mt-1 text-[10.5px] ${m.mine ? 'text-cyan-100' : 'text-gray-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 p-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || sendMessage.isPending}
          className="flex shrink-0 items-center justify-center rounded-lg bg-cyan-600 px-3.5 py-2 text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendIcon />
        </button>
      </div>
    </>
  );
}
