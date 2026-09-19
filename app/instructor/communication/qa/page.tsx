'use client';

import { useMemo, useState } from 'react';
import { ColumnsIcon, ListIcon } from '@/components/instructor/SidebarIcons';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useQaQuestions, useQaThread, useReplyToQuestion } from '@/hooks/useCommunication';
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
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Hỏi đáp</h1>
        <div className="flex items-center gap-2">
          <CourseFilterDropdown courses={courses ?? []} value={courseId} onChange={setCourseId} />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300"
            >
              Sắp xếp: {sort === 'newest' ? 'Mới nhất' : 'Cũ nhất'} ▾
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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

          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('double')}
              title="Xem 2 cột"
              className={`flex items-center px-2.5 py-2 ${viewMode === 'double' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <ColumnsIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              title="Xem 1 cột"
              className={`flex items-center px-2.5 py-2 ${viewMode === 'single' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      <label className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-gray-600">
        <input
          type="checkbox"
          checked={onlyUnanswered}
          onChange={(e) => setOnlyUnanswered(e.target.checked)}
          className="accent-cyan-600"
        />
        Chỉ hiện câu hỏi chưa có câu trả lời
      </label>

      {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
      {!isLoading && questions.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
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
        <div className="grid grid-cols-[minmax(0,1fr)_1.3fr] gap-4">
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
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {selectedInDoubleView ? (
              <QaThreadPanel questionId={selectedInDoubleView} />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-[13px] text-gray-400">
                Chọn 1 câu hỏi để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'single' && activeQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <span className="font-display text-[15px] font-bold text-gray-900">Chi tiết câu hỏi</span>
              <button type="button" onClick={() => setActiveQuestionId(null)} className="text-xl text-gray-400 hover:text-gray-600">×</button>
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
        active ? 'border-cyan-400 ring-1 ring-cyan-200' : 'border-gray-200 hover:border-cyan-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-semibold text-cyan-700">{q.courseTitle} · {q.lessonTitle}</span>
        <span className="shrink-0 text-[11.5px] text-gray-400">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
      <p className="line-clamp-2 text-[13.5px] text-gray-800">
        <span className="font-semibold">{q.userName}: </span>{q.content}
      </p>
      <div className="flex items-center gap-2 text-[11.5px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${q.answerCount === 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {q.answerCount === 0 ? 'Chưa có câu trả lời' : `${q.answerCount} câu trả lời`}
        </span>
        {q.hasInstructorAnswer && (
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">Bạn đã trả lời</span>
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
        {isLoading && <p className="text-sm text-gray-500">Đang tải...</p>}
        {thread && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center justify-between text-[12px] text-gray-500">
                <span className="font-semibold text-gray-800">{thread.question.userName}</span>
                <span>{new Date(thread.question.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <p className="text-[13.5px] text-gray-800">{thread.question.content}</p>
              <p className="mt-1.5 text-[11.5px] text-gray-400">{thread.question.courseTitle} · {thread.question.lessonTitle}</p>
            </div>

            {thread.answers.map((a) => (
              <div key={a.id} className={`rounded-lg p-3 ${a.isInstructor ? 'bg-cyan-50' : 'bg-gray-50'}`}>
                <div className="mb-1 flex items-center justify-between text-[12px] text-gray-500">
                  <span className={`font-semibold ${a.isInstructor ? 'text-cyan-700' : 'text-gray-800'}`}>
                    {a.userName}{a.isInstructor ? ' (Giảng viên)' : ''}
                  </span>
                  <span>{new Date(a.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p className="text-[13.5px] text-gray-800">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-gray-100 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Trả lời học viên..."
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleReply}
          disabled={!content.trim() || replyMutation.isPending}
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
