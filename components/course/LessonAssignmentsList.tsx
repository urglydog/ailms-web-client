'use client';

import { useState, type FormEvent } from 'react';
import { useLessonAssignmentsForStudent, useSubmitAssignment } from '@/hooks/useCommunication';
import type { StudentAssignmentItem } from '@/lib/api/communication';

/** Danh sách bài tập tự luận/nộp file của 1 bài giảng, phía Học viên (19/09/2026, tính năng
 * mới) — hiển thị trong tab "Học liệu" của trang học bài, phía trên `MaterialManager`. Không
 * hiện gì nếu bài giảng này chưa có bài tập nào (không làm rối giao diện). */
export function LessonAssignmentsList({ lessonId }: { lessonId: number }) {
  const { data: assignments, isLoading } = useLessonAssignmentsForStudent(lessonId, true);

  if (isLoading || !assignments || assignments.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-base font-bold text-ink">Bài tập</h3>
      {assignments.map((item) => (
        <AssignmentCard key={item.assignment.id} lessonId={lessonId} item={item} />
      ))}
    </div>
  );
}

function AssignmentCard({ lessonId, item }: { lessonId: number; item: StudentAssignmentItem }) {
  const { assignment, mySubmission } = item;
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const submit = useSubmitAssignment();

  const isGraded = mySubmission?.score != null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !file) return;
    submit.mutate(
      { assignmentId: assignment.id, lessonId, textContent: textContent.trim(), file },
      { onSuccess: () => { setTextContent(''); setFile(null); } },
    );
  };

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-bold text-ink">{assignment.title}</p>
          {assignment.dueDate && (
            <p className="text-[12px] text-ink-muted">Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</p>
          )}
        </div>
        {assignment.maxScore != null && (
          <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-bold text-accent">
            Tối đa {assignment.maxScore} điểm
          </span>
        )}
      </div>

      {assignment.instructions && (
        <p className="whitespace-pre-line text-[13px] text-ink-muted">{assignment.instructions}</p>
      )}

      {mySubmission ? (
        <div className="rounded-lg bg-surface-hover p-3">
          <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-faint">
            Bài đã nộp · {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}
          </p>
          {mySubmission.textContent && <p className="mb-1.5 whitespace-pre-line text-[13px] text-ink">{mySubmission.textContent}</p>}
          {mySubmission.fileUrl && (
            <a href={mySubmission.fileUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-accent hover:underline">
              📎 {mySubmission.fileName ?? 'Tệp đã nộp'}
            </a>
          )}
          {isGraded ? (
            <div className="mt-2 border-t border-line-soft pt-2">
              <p className="text-[13px] font-bold text-success">
                Điểm: {mySubmission.score}{assignment.maxScore != null ? `/${assignment.maxScore}` : ''}
              </p>
              {mySubmission.feedback && <p className="mt-0.5 text-[12.5px] text-ink-muted">{mySubmission.feedback}</p>}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-ink-muted">Đang chờ giảng viên chấm điểm.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={3}
            placeholder="Nhập nội dung bài làm..."
            className="resize-none rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-[11.5px] file:font-semibold"
          />
          <button
            type="submit"
            disabled={(!textContent.trim() && !file) || submit.isPending}
            className="self-start rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submit.isPending ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </form>
      )}
    </div>
  );
}
