'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommunitySocket, ChatMessage } from '@/hooks/useCommunitySocket';

interface LiveChatPanelProps {
  lessonId: number;
  userName: string;
}

export function LiveChatPanel({ lessonId, userName }: LiveChatPanelProps) {
  const { messages, sendMessage } = useCommunitySocket(lessonId);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expandedReplies]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue.trim(), userName, replyingTo?.id);
    
    setInputValue('');
    setReplyingTo(null);
  };

  const handleReplyClick = (msg: ChatMessage) => {
    if (msg.senderName === userName) {
      alert('Bạn không thể trả lời tin nhắn của chính mình!');
      return;
    }
    // Giữ cấu trúc 1 cấp: Nếu reply 1 reply khác, ta gán parentId bằng parent gốc
    const parentId = msg.parentId || msg.id;
    const parentMsg = messages.find(m => m.id === parentId) || msg;
    setReplyingTo(parentMsg);
    setInputValue(`@${msg.senderName} `);
    inputRef.current?.focus();
  };

  const toggleReplies = (parentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
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

  const renderMessage = (msg: ChatMessage, isReply: boolean = false) => (
    <div key={msg.id} className={`flex flex-col ${isReply ? 'ml-2' : ''}`}>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[13px] font-bold text-ink">{msg.senderName}</span>
        <span className="text-[11px] text-ink-faint">
          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button
          onClick={() => handleReplyClick(msg)}
          className="text-[11px] text-accent hover:underline ml-1 font-semibold"
        >
          Trả lời
        </button>
      </div>
      <p className="text-sm text-ink leading-snug bg-gray-50 border border-line-soft rounded-lg rounded-tl-none p-2 w-fit">
        {msg.content}
      </p>
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
            const replies = repliesByParent[msg.id] || [];
            const isExpanded = expandedReplies.has(msg.id);
            
            return (
              <div key={msg.id} className="flex flex-col">
                {renderMessage(msg)}
                
                {replies.length > 0 && (
                  <div className="ml-8 mt-1">
                    <button 
                      onClick={() => toggleReplies(msg.id)}
                      className="text-[12px] font-semibold text-ink-muted hover:text-ink flex items-center gap-1 mb-2"
                    >
                      {isExpanded ? 'Ẩn bớt' : `Xem ${replies.length} câu trả lời`}
                    </button>
                    
                    {isExpanded && (
                      <div className="flex flex-col gap-3 border-l-2 border-line-soft pl-3">
                        {replies.map(reply => renderMessage(reply, true))}
                      </div>
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
          <div className="px-3 py-2 bg-gray-100 text-xs text-ink-muted flex justify-between items-center border-b border-line">
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
