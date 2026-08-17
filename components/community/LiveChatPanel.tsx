'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommunitySocket } from '@/hooks/useCommunitySocket';

interface LiveChatPanelProps {
  lessonId: number;
  userName: string;
}

export function LiveChatPanel({ lessonId, userName }: LiveChatPanelProps) {
  const { messages, sendMessage } = useCommunitySocket(lessonId);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim(), userName);
    setInputValue('');
  };

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
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-ink-muted text-center">
            Chưa có tin nhắn nào.<br/>Hãy là người đầu tiên đặt câu hỏi!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[13px] font-bold text-ink">{msg.senderName}</span>
                <span className="text-[11px] text-ink-faint">
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-ink leading-snug bg-gray-50 border border-line-soft rounded-lg rounded-tl-none p-2 w-fit">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-surface-hover border-t border-line flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập câu hỏi hoặc thảo luận..."
          className="flex-1 text-sm bg-surface border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
        />
        <button 
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
