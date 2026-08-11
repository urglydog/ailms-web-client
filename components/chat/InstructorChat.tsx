'use client';

import { useState, useRef, useEffect } from 'react';
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

export function InstructorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, data?: AssistantDataPayload}[]>([]);
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
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 z-50"
      >
        <span 
          className="text-2xl transition-transform duration-300 ease-in-out" 
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          {isOpen ? '✕' : '📊'}
        </span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 flex h-[500px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 z-50 origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20 pointer-events-none'
        }`}
      >
        <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
          <div>
            <h3 className="font-display font-semibold">AI Teaching Assistant</h3>
            <p className="text-xs opacity-90">Phân tích dữ liệu & Gợi ý cải thiện</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>
        
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Xin chào! Tôi có thể giúp bạn phân tích số liệu học viên, xem đánh giá, hoặc gợi ý cải thiện khóa học. Bạn cần hỗ trợ gì?
              </div>
            )}
            
            {messages.map((msg, i) => (
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
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
                
                {msg.data && msg.data.function === 'get_my_course_stats' && (
                  <div className="mt-2 w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">📊 Tổng quan số liệu</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="bg-blue-50 p-2 rounded">
                          <span className="block text-gray-500">Doanh thu</span>
                          <strong className="text-blue-700">{msg.data.data?.totalRevenue?.toLocaleString()} đ</strong>
                       </div>
                       <div className="bg-blue-50 p-2 rounded">
                          <span className="block text-gray-500">Học viên</span>
                          <strong className="text-blue-700">{msg.data.data?.totalStudents}</strong>
                       </div>
                    </div>
                  </div>
                )}

                {msg.data && msg.data.function === 'analyze_reviews' && (
                  <div className="mt-2 w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs">
                    <h4 className="font-bold text-gray-700 mb-2 uppercase">⭐ Đánh giá học viên</h4>
                    <p className="mb-1"><strong>Trung bình:</strong> {msg.data.average_rating}/5.0 ({msg.data.total_reviews} đánh giá)</p>
                    <div className="flex gap-4 mt-2">
                      <div className="text-green-600">👍 {msg.data.positive_count} tích cực</div>
                      <div className="text-red-600">👎 {msg.data.negative_count} cần cải thiện</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="self-start px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-500 rounded-bl-sm flex items-center gap-2 shadow-sm text-sm">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                </span>
                Đang phân tích...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
}'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

export function InstructorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, data?: any}[]>([]);
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
      const data = await api.post<any>('/api/v1/instructor/ai-assistant/chat', { message: userMsg }, {
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
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 z-50"
      >
        <span 
          className="text-2xl transition-transform duration-300 ease-in-out" 
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          {isOpen ? '✕' : '📊'}
        </span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 flex h-[500px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 z-50 origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20 pointer-events-none'
        }`}
      >
        <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
          <div>
            <h3 className="font-display font-semibold">AI Teaching Assistant</h3>
            <p className="text-xs opacity-90">Phân tích dữ liệu & Gợi ý cải thiện</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Xin chào! Tôi có thể giúp bạn phân tích số liệu học viên, xem đánh giá, hoặc gợi ý cải thiện khóa học. Bạn cần hỗ trợ gì?
              </div>
            )}
            
            {messages.map((msg, i) => (
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
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
                
                {msg.data && msg.data.function === 'get_my_course_stats' && (
                  <div className="mt-2 w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">📊 Tổng quan số liệu</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="bg-blue-50 p-2 rounded">
                          <span className="block text-gray-500">Doanh thu</span>
                          <strong className="text-blue-700">{msg.data.data.totalRevenue?.toLocaleString()} đ</strong>
                       </div>
                       <div className="bg-blue-50 p-2 rounded">
                          <span className="block text-gray-500">Học viên</span>
                          <strong className="text-blue-700">{msg.data.data.totalStudents}</strong>
                       </div>
                    </div>
                  </div>
                )}

                {msg.data && msg.data.function === 'analyze_reviews' && (
                  <div className="mt-2 w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs">
                    <h4 className="font-bold text-gray-700 mb-2 uppercase">⭐ Đánh giá học viên</h4>
                    <p className="mb-1"><strong>Trung bình:</strong> {msg.data.average_rating}/5.0 ({msg.data.total_reviews} đánh giá)</p>
                    <div className="flex gap-4 mt-2">
                      <div className="text-green-600">👍 {msg.data.positive_count} tích cực</div>
                      <div className="text-red-600">👎 {msg.data.negative_count} cần cải thiện</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="self-start px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-500 rounded-bl-sm flex items-center gap-2 shadow-sm text-sm">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                </span>
                Đang phân tích...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
