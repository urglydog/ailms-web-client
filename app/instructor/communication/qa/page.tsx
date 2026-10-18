'use client';

import { useMemo, useState } from 'react';
import { ColumnsIcon, ListIcon } from '@/components/instructor/SidebarIcons';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useQaQuestions, useQaThread, useReplyToQuestion } from '@/hooks/useCommunication';
import { Avatar } from '@/components/ui/Avatar';
import type { QaQuestion } from '@/lib/api/communication';

type SortOption = 'newest' | 'oldest';
type ViewMode = 'single' | 'double';

/** "Giao tiếp > Hỏi đáp" (19/09/2026, xây mới; bổ sung tìm kiếm/sắp xếp/2 kiểu xem — giao diện
 * tham khảo Udemy) — tái dùng chat theo bài học có sẵn (`LessonChat`) làm mô hình Q&A: tin GỐC
 * là câu hỏi, tin trả lời của Giảng viên phát lại qua WebSocket cho học viên thấy ngay trong tab
 * "Hỏi đáp" của trang học bài. */
export default function InstructorQaPage() {
  const [courseId, setCourseId] = useState<number | ''>('');
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: courses } = useInstructorCourseOptions();
  const { data: questionsPage, isLoading } = useQaQuestions({
    courseId: courseId || undefined,
    onlyUnanswered,
  });

  const questions = useMemo(() => {
    const list = questionsPage?.content ?? [];
    return sort === 'newest' ? list : [...list].reverse();
  }, [questionsPage, sort]);

  const selectedInDoubleView = viewMode === 'double' ? activeQuestionId : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">Hỏi đáp</h1>
        <div className="flex items-center gap-2">
          <CourseFilterDropdown courses={courses ?? []} value={courseId} onChange={setCourseId} />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-accent"
            >
              Sắp xếp: {sort === 'newest' ? 'Mới nhất' : 'Cũ nhất'} ▾
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
                  {(['newest', 'oldest'] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { setSort(option); setShowSortMenu(false); }}
                      className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-surface ${sort === option ? 'font-bold text-accent-dark' : 'text-ink'}`}
                    >
                      {option === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex overflow-hidden rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setViewMode('double')}
              title="Xem 2 cột"
              className={`flex items-center px-2.5 py-2 ${viewMode === 'double' ? 'bg-accent text-white' : 'bg-white text-ink-muted hover:bg-surface'}`}
            >
              <ColumnsIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              title="Xem 1 cột"
              className={`flex items-center px-2.5 py-2 ${viewMode === 'single' ? 'bg-accent text-white' : 'bg-white text-ink-muted hover:bg-surface'}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      <label className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-muted">
        <input
          type="checkbox"
          checked={onlyUnanswered}
          onChange={(e) => setOnlyUnanswered(e.target.checked)}
          className="accent-cyan-600"
        />
        Chỉ hiện câu hỏi chưa có câu trả lời
      </label>

      {isLoading && <div className="p-10 text-center text-sm text-ink-muted">Đang tải...</div>}
      {!isLoading && questions.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-muted shadow-sm">
          Chưa có câu hỏi nào.
        </div>
      )}

      {viewMode === 'single' ? (
        <div className="flex flex-col gap-2">
          {questions.map((q) => (
            <QuestionRow key={q.id} question={q} active={false} onClick={() => setActiveQuestionId(q.id)} />
          ))}
        </div>
      ) : (
        // (26/09/2026, sửa lỗi) — 2 cột cố định không co giãn dưới `lg`, quá hẹp để đọc câu hỏi
        // lẫn chi tiết. Dưới `lg` xếp dọc (vẫn dùng được, chỉ không tối ưu bằng chế độ "1 cột"
        // vốn đã có modal riêng — người dùng có thể tự chuyển).
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_1.3fr]">
          <div className="flex max-h-[calc(100vh-260px)] flex-col gap-2 overflow-y-auto pr-1">
            {questions.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                active={selectedInDoubleView === q.id}
                onClick={() => setActiveQuestionId(q.id)}
              />
            ))}
          </div>
          <div className="rounded-xl border border-line bg-white shadow-sm">
            {selectedInDoubleView ? (
              <QaThreadPanel questionId={selectedInDoubleView} />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-[13px] text-ink-muted">
                Chọn 1 câu hỏi để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'single' && activeQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
              <span className="font-display text-[15px] font-bold text-ink">Chi tiết câu hỏi</span>
              <button type="button" onClick={() => setActiveQuestionId(null)} className="text-xl text-ink-muted hover:text-gray-600">×</button>
            </div>
            <QaThreadPanel questionId={activeQuestionId} />
          </div>
        </div>
      )}
    </>
  );
}

function QuestionRow({ question: q, active, onClick }: { question: QaQuestion; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${
        active ? 'border-cyan-400 ring-1 ring-cyan-200' : 'border-line hover:border-cyan-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-semibold text-accent-dark">{q.courseTitle} · {q.lessonTitle}</span>
        <span className="shrink-0 text-[11.5px] text-ink-muted">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
      <p className="line-clamp-2 flex items-start gap-1.5 text-[13.5px] text-ink">
        <Avatar name={q.userName} avatarUrl={q.userAvatarUrl} size={18} />
        <span><span className="font-semibold">{q.userName}: </span>{q.content}</span>
      </p>
      <div className="flex items-center gap-2 text-[11.5px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${q.answerCount === 0 ? 'bg-white text-ink' : 'bg-line-soft text-ink-muted'}`}>
          {q.answerCount === 0 ? 'Chưa có câu trả lời' : `${q.answerCount} câu trả lời`}
        </span>
        {q.hasInstructorAnswer && (
          <span className="rounded-full bg-tint px-2 py-0.5 font-semibold text-accent-dark">Bạn đã trả lời</span>
        )}
      </div>
    </button>
  );
}

function QaThreadPanel({ questionId }: { questionId: string }) {
  const { data: thread, isLoading } = useQaThread(questionId);
  const replyMutation = useReplyToQuestion();
  const [content, setContent] = useState('');

  const handleReply = () => {
    if (!content.trim()) return;
    replyMutation.mutate({ questionId, content: content.trim() }, { onSuccess: () => setContent('') });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading && <p className="text-sm text-ink-muted">Đang tải...</p>}
        {thread && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg bg-surface p-3">
              <Avatar name={thread.question.userName} avatarUrl={thread.question.userAvatarUrl} size={26} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between text-[12px] text-ink-muted">
                  <span className="font-semibold text-ink">{thread.question.userName}</span>
                  <span>{new Date(thread.question.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p className="text-[13.5px] text-ink">{thread.question.content}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-muted">{thread.question.courseTitle} · {thread.question.lessonTitle}</p>
              </div>
            </div>

            {thread.answers.map((a) => (
              <div key={a.id} className={`flex items-start gap-2 rounded-lg p-3 ${a.isInstructor ? 'bg-tint' : 'bg-surface'}`}>
                <Avatar name={a.userName} avatarUrl={a.userAvatarUrl} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-[12px] text-ink-muted">
                    <span className={`font-semibold ${a.isInstructor ? 'text-accent-dark' : 'text-ink'}`}>
                      {a.userName}{a.isInstructor ? ' (Giảng viên)' : ''}
                    </span>
                    <span>{new Date(a.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-[13.5px] text-ink">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-line-soft p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Trả lời học viên..."
          className="flex-1 resize-none rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleReply}
          disabled={!content.trim() || replyMutation.isPending}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
