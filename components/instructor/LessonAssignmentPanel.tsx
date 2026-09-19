'use client';

import { useState, type FormEvent } from 'react';
import { useCreateAssignment, useDeleteAssignment, useLessonAssignmentsForInstructor } from '@/hooks/useCommunication';

/** "+ Bài tập" (19/09/2026, tính năng mới) — bài tập tự luận/nộp file gắn với bài giảng này,
 * Giảng viên chấm điểm thủ công ở "Giao tiếp > Bài tập" (khác Quiz trắc nghiệm tự chấm). Cùng
 * khuôn accordion với {@link import('./LessonResourcePanel').LessonResourcePanel}. */
export function LessonAssignmentPanel({ lessonId }: { lessonId: number }) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: assignments, isLoading } = useLessonAssignmentsForInstructor(lessonId);
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createAssignment.mutate(
      {
        lessonId,
        title: title.trim(),
        instructions: instructions.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        maxScore: maxScore.trim() ? Number(maxScore) : null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setInstructions('');
          setDueDate('');
          setMaxScore('');
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div
      draggable={false}
      onDragStart={(e) => e.stopPropagation()}
      className="mt-2 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
    >
      <h4 className="text-[12.5px] font-bold text-gray-800">Bài tập</h4>
      <p className="text-[11.5px] leading-relaxed text-gray-400">
        Bài tập tự luận/nộp file cho bài giảng này — bạn chấm điểm và phản hồi thủ công ở mục
        &quot;Giao tiếp &gt; Bài tập&quot;.
      </p>

      {isLoading && <p className="text-[12px] text-gray-400">Đang tải...</p>}

      <div className="flex flex-col gap-1.5">
        {assignments?.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 text-[12.5px]">
            <span className="min-w-0 flex-1 truncate text-gray-700">📝 {a.title}</span>
            <span className="shrink-0 text-gray-400">{a.submissionCount} bài nộp</span>
            <button
              type="button"
              draggable={false}
              onClick={() => deleteAssignment.mutate(a.id)}
              className="shrink-0 text-[11.5px] font-bold text-red-500 hover:text-red-700"
            >
              Xóa
            </button>
          </div>
        ))}
        {assignments?.length === 0 && !isLoading && (
          <p className="text-[12px] text-gray-400">Chưa có bài tập nào.</p>
        )}
      </div>

      {!showForm ? (
        <button
          type="button"
          draggable={false}
          onClick={() => setShowForm(true)}
          className="self-start rounded-lg bg-cyan-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700"
        >
          + Thêm bài tập
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2" draggable={false}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài tập"
            draggable={false}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="Hướng dẫn làm bài..."
            draggable={false}
            className="resize-none rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              draggable={false}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
            />
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="Điểm tối đa"
              draggable={false}
              className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              draggable={false}
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              draggable={false}
              disabled={!title.trim() || createAssignment.isPending}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createAssignment.isPending ? 'Đang lưu...' : 'Lưu bài tập'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
