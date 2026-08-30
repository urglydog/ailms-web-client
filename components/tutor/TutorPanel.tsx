'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useTutorChat } from '@/hooks/useTutorChat';
import { ApiError } from '@/lib/api/client';
import type { TutorAttachment, TutorSession } from '@/types/domain';

const TIMESTAMP_RE = /\[(\d{1,3}):([0-5]?\d)\]/g;

/** UC30 mở rộng — giới hạn tệp đính kèm (khớp `lms.rules.max-tutor-attachments-per-turn`/
 * `max-tutor-attachment-size-mb` bên be/, kiểm ở đây chỉ để phản hồi sớm cho học viên). */
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE_MB = 8;
const ACCEPTED_FILE_TYPES = 'image/*,.txt,.md,.py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.h,.cs,.go,.rs,.json,.csv,.pdf,application/pdf';

/** `[MM:SS]` (BR-TUTOR-02) -> link Markdown giả `[▶ MM:SS](tutor-seek:giay)` — override
 * component `a` bên dưới bắt đúng scheme này để render thành nút tua, không phải link thật. */
function injectTimestampLinks(content: string): string {
  return content.replace(TIMESTAMP_RE, (_match, m: string, s: string) => {
    const sec = Number(m) * 60 + Number(s);
    return `[▶ ${m.padStart(2, '0')}:${s.padStart(2, '0')}](tutor-seek:${sec})`;
  });
}

/** UC30 mở rộng — trả lời có định dạng Markdown (danh sách/bảng/tiêu đề/in đậm) thay vì văn
 * bản thô, dễ đọc hơn hẳn cho nội dung nhiều ý. Mốc thời gian vẫn là nút bấm tua được, không
 * phải link thật (xem `injectTimestampLinks`). */
function MarkdownMessage({ content, onSeek }: { content: string; onSeek: (sec: number) => void }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          if (href?.startsWith('tutor-seek:')) {
            const sec = Number(href.slice('tutor-seek:'.length));
            return (
              <button
                type="button"
                onClick={() => onSeek(sec)}
                className="mx-0.5 inline rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20"
              >
                {children}
              </button>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              {children}
            </a>
          );
        },
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-1.5 list-disc pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-1.5 list-decimal pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        h3: ({ children }) => <h3 className="mb-1 mt-2 text-[13px] font-bold first:mt-0">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        code: ({ children }) => <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[12px]">{children}</code>,
        table: ({ children }) => (
          <div className="mb-1.5 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-line bg-surface px-2 py-1 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-line px-2 py-1">{children}</td>,
      }}
    >
      {injectTimestampLinks(content)}
    </ReactMarkdown>
  );
}

/** Ảnh render TRỰC TIẾP trong khung chat (chỉ để xem, không phải link "tải xuống") — tệp khác
 * hiện dạng nhãn tên file, không có gì để bấm tải lại (đỡ tốn hạn mức băng thông B2). */
function AttachmentThumb({ attachment }: { attachment: TutorAttachment }) {
  if (attachment.mimeType.startsWith('image/')) {
    // eslint-disable-next-line @next/next/no-img-element -- anh tu B2/blob URL dong, khong hop voi next/image tinh
    return <img src={attachment.previewUrl} alt={attachment.fileName} className="max-h-40 rounded-lg border border-line/50 object-cover" />;
  }
  return (
    <div className="flex max-w-[220px] items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink-muted shadow-sm">
      <span aria-hidden>📄</span>
      <span className="truncate">{attachment.fileName}</span>
    </div>
  );
}

interface SessionRowProps {
  session: TutorSession;
  isActive: boolean;
  menuOpen: boolean;
  isEditing: boolean;
  onOpen: () => void;
  onToggleMenu: () => void;
  onStartRename: () => void;
  onSubmitRename: (title: string) => void;
  onCancelRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function SessionRow({
  session, isActive, menuOpen, isEditing, onOpen, onToggleMenu,
  onStartRename, onSubmitRename, onCancelRename, onTogglePin, onDelete,
}: SessionRowProps) {
  const [draftTitle, setDraftTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraftTitle(session.title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, session.title]);

  if (isEditing) {
    return (
      <li className="px-4 py-2">
        <input
          ref={inputRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmitRename(draftTitle);
            if (e.key === 'Escape') onCancelRename();
          }}
          onBlur={() => onSubmitRename(draftTitle)}
          className="w-full rounded-lg border border-accent bg-white px-2 py-1.5 text-sm text-ink outline-none"
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full flex-col items-start gap-0.5 py-2.5 pl-4 pr-9 text-left transition-colors hover:bg-surface ${
          isActive ? 'bg-accent/10' : ''
        }`}
      >
        <span className="flex w-full items-center gap-1 truncate text-sm text-ink">
          {session.isPinned && <span aria-hidden title="Đã ghim">📌</span>}
          <span className="truncate">{session.title}</span>
        </span>
        <span className="text-xs text-ink-faint">
          {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true, locale: vi })}
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        title="Tuỳ chọn"
        aria-label="Tuỳ chọn cuộc trò chuyện"
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint opacity-0 transition-opacity hover:bg-line-soft group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={menuOpen}
      >
        ⋮
      </button>

      {menuOpen && (
        <div className="absolute right-1.5 top-9 z-10 w-40 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-card-hover">
          <button
            type="button"
            onClick={onTogglePin}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
          >
            {session.isPinned ? '📌 Bỏ ghim' : '📌 Ghim'}
          </button>
          <button
            type="button"
            onClick={onStartRename}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
          >
            ✏️ Đổi tên
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            🗑️ Xoá
          </button>
        </div>
      )}
    </li>
  );
}

interface TutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  onSeek: (seconds: number) => void;
}

/** UC30 — panel trượt từ cạnh phải, khác `DiscoveryChat`/`InstructorChat` (nổi góc). */
export function TutorPanel({ isOpen, onClose, lessonId, onSeek }: TutorPanelProps) {
  const {
    messages, sendQuestion, isSending, isRestoring,
    sessions, activeSessionId, switchSession, startNewChat,
    renameSession, togglePin, removeSession,
  } = useTutorChat(lessonId);
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // UC30 mở rộng — phân biệt "chuyển/phục hồi cả cuộc trò chuyện" (cuộn NGAY tới cuối, không
  // hoạt hình) với "vừa gửi 1 tin mới" (cuộn TRƯỢT mượt) — trước đây luôn cuộn mượt nên mở lại
  // 1 cuộc trò chuyện dài trông như đang "chạy" từ đầu xuống cuối, gây khó chịu.
  const lastSeenSessionRef = useRef<number | null>(null);

  useEffect(() => {
    const sessionChanged = lastSeenSessionRef.current !== activeSessionId;
    lastSeenSessionRef.current = activeSessionId;
    if (sessionChanged) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, activeSessionId]);

  const handleSend = () => {
    const question = input.trim();
    if (!question || isSending) return;
    setInput('');
    sendQuestion(question, pendingFiles);
    setPendingFiles([]);
  };

  /** UC30 mở rộng — 1 hàm dùng chung cho cả 3 cách đính kèm: bấm "+", dán (Ctrl+V), kéo thả. */
  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const combined = [...pendingFiles, ...incoming];
    if (combined.length > MAX_ATTACHMENTS) {
      toast.error(`Chỉ đính kèm tối đa ${MAX_ATTACHMENTS} tệp mỗi lượt hỏi.`);
      return;
    }
    const oversized = incoming.find((f) => f.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast.error(`Tệp "${oversized.name}" vượt quá ${MAX_ATTACHMENT_SIZE_MB}MB.`);
      return;
    }
    setPendingFiles(combined);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : sessions;

  const handleDelete = async (session: TutorSession) => {
    setOpenMenuId(null);
    if (!window.confirm(`Xoá cuộc trò chuyện "${session.title}"? Không thể hoàn tác.`)) return;
    try {
      await removeSession(session.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không xoá được cuộc trò chuyện này.');
    }
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowHistory(false);
                void startNewChat();
              }}
              title="Cuộc trò chuyện mới"
              aria-label="Bắt đầu cuộc trò chuyện mới"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/20"
            >
              ✚
            </button>
            <button
              type="button"
              onClick={() => {
                setShowHistory((v) => !v);
                setOpenMenuId(null);
              }}
              title="Lịch sử trò chuyện"
              aria-label="Xem lịch sử trò chuyện"
              aria-expanded={showHistory}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/20 ${showHistory ? 'bg-white/20' : ''}`}
            >
              🕘
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {showHistory ? (
          // UC30 mở rộng — mở lịch sử thì CHIẾM TOÀN BỘ phần thân, ẩn hẳn nội dung tin nhắn bên
          // dưới để tập trung tìm/chọn, đúng góp ý — không phải 1 dropdown nhỏ đè lên trên nữa.
          <div className="flex flex-1 flex-col overflow-hidden bg-white" onClick={() => setOpenMenuId(null)}>
            <div className="border-b border-line p-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm cuộc trò chuyện…"
                aria-label="Tìm cuộc trò chuyện"
                className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-faint">
                  {sessions.length === 0 ? 'Chưa có cuộc trò chuyện nào trước đây' : 'Không tìm thấy cuộc trò chuyện nào khớp'}
                </p>
              ) : (
                <ul>
                  {filteredSessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      isActive={s.id === activeSessionId}
                      menuOpen={openMenuId === s.id}
                      isEditing={editingId === s.id}
                      onOpen={() => {
                        void switchSession(s.id);
                        setShowHistory(false);
                      }}
                      onToggleMenu={() => setOpenMenuId((cur) => (cur === s.id ? null : s.id))}
                      onStartRename={() => {
                        setOpenMenuId(null);
                        setEditingId(s.id);
                      }}
                      onSubmitRename={(title) => {
                        setEditingId(null);
                        const trimmed = title.trim();
                        if (trimmed && trimmed !== s.title) void renameSession(s.id, trimmed);
                      }}
                      onCancelRename={() => setEditingId(null)}
                      onTogglePin={() => {
                        setOpenMenuId(null);
                        void togglePin(s.id, !s.isPinned);
                      }}
                      onDelete={() => void handleDelete(s)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="relative flex-1 overflow-y-auto bg-[#F8F9FA] p-4"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
            >
              {isDraggingFile && (
                <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/5 text-sm font-medium text-accent">
                  Thả tệp vào đây để đính kèm
                </div>
              )}
              {isRestoring && (
                <p className="mt-4 text-center text-sm text-ink-faint">Đang tải lại cuộc trò chuyện…</p>
              )}
              {!isRestoring && messages.length === 0 && (
                <p className="mt-4 text-center text-sm text-ink-muted">
                  Chào bạn! Hỏi mình bất cứ điều gì về bài học này nhé — mình sẽ gợi ý để bạn tự tìm ra
                  câu trả lời, chứ không đưa đáp án trực tiếp đâu 😉
                </p>
              )}
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                    {msg.attachments.length > 0 && (
                      <div className="mb-1 flex max-w-[85%] flex-wrap justify-end gap-1.5">
                        {msg.attachments.map((att) => (
                          <AttachmentThumb key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}
                    {msg.content && (
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          msg.sender === 'USER'
                            ? 'rounded-br-none bg-accent text-white whitespace-pre-wrap'
                            : 'rounded-bl-none border border-line bg-white text-ink shadow-sm'
                        }`}
                      >
                        {msg.sender === 'AI' ? <MarkdownMessage content={msg.content} onSeek={onSeek} /> : msg.content}
                      </div>
                    )}
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
              className="flex flex-col gap-2 border-t border-line bg-white p-3"
            >
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink-muted"
                    >
                      <span aria-hidden>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                      <span className="max-w-[140px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        aria-label={`Bỏ đính kèm ${file.name}`}
                        className="text-ink-faint hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files ?? []));
                    e.target.value = ''; // cho chon lai dung 1 tep vua bo neu can
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pendingFiles.length >= MAX_ATTACHMENTS}
                  title="Đính kèm tệp"
                  aria-label="Đính kèm tệp"
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface disabled:opacity-40"
                >
                  ＋
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={(e) => {
                    const files = Array.from(e.clipboardData.files);
                    if (files.length > 0) {
                      e.preventDefault();
                      addFiles(files);
                    }
                  }}
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
              </div>
            </form>
          </>
        )}
      </aside>
    </>
  );
}
