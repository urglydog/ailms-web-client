'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

interface CourseStatsData {
  totalRevenue?: number;
  totalStudents?: number;
}

interface AssistantDataPayload {
  function?: string;
  data?: CourseStatsData;
  average_rating?: number;
  total_reviews?: number;
  positive_count?: number;
  negative_count?: number;
}

interface InstructorChatResponse {
  reply?: string;
  data?: AssistantDataPayload;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  data?: AssistantDataPayload;
}

function renderFormattedMessage(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;
        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

        return (
          <p key={idx} className="m-0">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-bold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={pIdx} className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] text-blue-700 border border-blue-100">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function InstructorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const data = await api.post<InstructorChatResponse>('/api/v1/instructor/ai-assistant/chat', { message: userMsg }, {
        token: getAccessToken() || undefined
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.reply || 'Không có phản hồi.', 
        data: data.data 
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Xin lỗi, tôi đang gặp sự cố kết nối tới AI. Vui lòng kiểm tra lại.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
        title="Trợ lý Giảng viên AI"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all duration-300 transform flex flex-col ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">Trợ Lý Giảng Viên AI</h3>
              <span className="text-[10px] text-blue-100">Sẵn sàng hỗ trợ phân tích khóa học</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Xin chào! Tôi có thể giúp bạn phân tích số liệu học viên, xem đánh giá, hoặc gợi ý cải thiện khóa học. Bạn cần hỗ trợ gì?
            </div>
          )}
          
          {messages.map((msg: ChatMessage, i: number) => (
            <div 
              key={i} 
              className={`flex flex-col max-w-[85%] ${
                msg.role === 'user' 
                  ? 'self-end items-end' 
                  : 'self-start items-start'
              }`}
            >
              <div 
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? renderFormattedMessage(msg.text) : msg.text}
              </div>

              {/* Enhanced UI Card for Assistant Data Payload */}
              {msg.data && (
                <div className="mt-2 w-full rounded-xl bg-white p-3 border border-gray-200 text-xs shadow-sm space-y-1.5">
                  {msg.data.data && (
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-medium">Doanh thu:</span>
                      <span className="font-bold text-emerald-600">{msg.data.data.totalRevenue?.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  {msg.data.average_rating !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Đánh giá trung bình:</span>
                      <span className="font-bold text-amber-500">⭐ {msg.data.average_rating}</span>
                    </div>
                  )}
                  {msg.data.positive_count !== undefined && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-600 font-medium">Tích cực: {msg.data.positive_count}</span>
                      <span className="text-red-500 font-medium">Tiêu cực: {msg.data.negative_count}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none w-20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form 
            onSubmit={(e: React.FormEvent) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              placeholder="Hỏi trợ lý (VD: Doanh thu tháng này?)..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors"
            >
              ↑
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
