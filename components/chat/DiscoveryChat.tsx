'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface DiscoveryCourseCard {
  id: number;
  title: string;
  slug: string;
  instructor_name: string;
  price_label: string;
  is_free: boolean;
  rating: number;
  level_label: string;
}

export function DiscoveryChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, courses?: DiscoveryCourseCard[]}[]>([]);
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
      // AI Worker HTTP API (Port 8002 as configured in .env)
      const res = await fetch('http://localhost:8002/api/v1/discovery/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.reply || 'Không có phản hồi.', 
        courses: data.courses 
      }]);
    } catch (err) {
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
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 z-50"
      >
        <span 
          className="text-2xl transition-transform duration-300 ease-in-out" 
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          {isOpen ? '✕' : '✨'}
        </span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 flex h-[500px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-line z-50 origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20 pointer-events-none'
        }`}
      >
        <div className="bg-accent px-4 py-3 text-white flex justify-between items-center">
          <div>
            <h3 className="font-display font-semibold">AI Course Discovery</h3>
            <p className="text-xs opacity-90">Tìm kiếm khóa học bằng ngôn ngữ tự nhiên</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F8F9FA]">
            {messages.length === 0 && (
              <div className="text-center text-sm text-ink-muted mt-4">
                Xin chào! Tôi là trợ lý AI. Bạn muốn tìm khóa học gì hôm nay?
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-white border border-line text-ink rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
                
                {msg.courses && msg.courses.length > 0 && (
                  <div className="mt-2 flex w-full max-w-full overflow-x-auto gap-3 pb-2 pt-1 no-scrollbar">
                    {msg.courses.map(c => (
                      <Link key={c.id} href={`/courses/${c.slug}`} className="min-w-[220px] max-w-[220px] flex-shrink-0 bg-white border border-line rounded-xl p-3 flex flex-col gap-2 no-underline hover:border-accent shadow-sm transition-colors">
                        <span className="font-semibold text-sm line-clamp-2 text-ink">{c.title}</span>
                        <span className="text-xs text-ink-muted">GV. {c.instructor_name}</span>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-line-soft">
                          <span className={`text-sm font-bold ${c.is_free ? 'text-success' : 'text-ink'}`}>{c.price_label}</span>
                          <span className="text-[10px] bg-surface-raised font-semibold px-2 py-1 rounded-full text-ink-muted">{c.level_label === 'ALL' ? 'Mọi cấp độ' : c.level_label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-white border border-line text-ink rounded-2xl rounded-bl-none px-4 py-2 text-sm shadow-sm flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-75">●</span>
                  <span className="animate-pulse delay-150">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-line p-3 bg-white">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 rounded-2xl border border-line bg-surface-raised flex overflow-hidden focus-within:border-accent focus-within:bg-white transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ví dụ: Khoá học IT cho người mới..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                      e.currentTarget.style.height = '42px'; // Reset height
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '42px';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                  className="w-full resize-none bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                  style={{ height: '42px' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-accent text-white disabled:opacity-50 transition-colors hover:bg-accent-hover mb-0.5"
              >
                ↑
              </button>
            </form>
          </div>
        </div>
    </>
  );
}
