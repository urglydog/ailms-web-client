'use client';

import { useEffect, useRef, useState } from 'react';
import { useTutorChat } from '@/hooks/useTutorChat';

const TIMESTAMP_RE = /\[(\d{1,3}):([0-5]?\d)\]/g;

function formatMmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Tách nội dung AI thành đoạn text xen kẽ nút bấm mốc thời gian (BR-TUTOR-02). */
function renderWithTimestamps(content: string, onSeek: (sec: number) => void) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TIMESTAMP_RE.lastIndex = 0;

  while ((match = TIMESTAMP_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const sec = Number(match[1]) * 60 + Number(match[2]);
    parts.push(
      <button
        key={`${match.index}-${sec}`}
        type="button"
        onClick={() => onSeek(sec)}
        className="mx-0.5 inline rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20"
      >
        ▶ {formatMmss(sec)}
      </button>,
    );
    lastIndex = TIMESTAMP_RE.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return parts;
}

interface TutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  onSeek: (seconds: number) => void;
}

/** UC30 — panel trượt từ cạnh phải, khác `DiscoveryChat`/`InstructorChat` (nổi góc). */
export function TutorPanel({ isOpen, onClose, lessonId, onSeek }: TutorPanelProps) {
  const { messages, sendQuestion, isSending } = useTutorChat(lessonId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = () => {
    const question = input.trim();
    if (!question || isSending) return;
    setInput('');
    sendQuestion(question);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-line bg-accent px-4 py-3 text-white">
          <div>
            <h3 className="font-display font-semibold">Gia sư AI Socratic</h3>
            <p className="text-xs opacity-90">Hỏi về nội dung bài học, không cho đáp án trực tiếp</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4">
          {messages.length === 0 && (
            <p className="mt-4 text-center text-sm text-ink-muted">
              Chào bạn! Hỏi mình bất cứ điều gì về bài học này nhé — mình sẽ gợi ý để bạn tự tìm ra
              câu trả lời, chứ không đưa đáp án trực tiếp đâu 😉
            </p>
          )}
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === 'USER'
                      ? 'rounded-br-none bg-accent text-white'
                      : 'rounded-bl-none border border-line bg-white text-ink shadow-sm'
                  }`}
                >
                  {msg.sender === 'AI' ? renderWithTimestamps(msg.content, onSeek) : msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-line bg-white px-4 py-2 text-sm text-ink shadow-sm">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-75">●</span>
                  <span className="animate-pulse delay-150">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2 border-t border-line bg-white p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về nội dung bài học..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="h-[42px] max-h-[120px] flex-1 resize-none rounded-2xl border border-line bg-surface-raised px-4 py-2.5 text-sm transition-colors focus:border-accent focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            ↑
          </button>
        </form>
      </aside>
    </>
  );
}
