'use client';

import { useState } from 'react';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useAssignmentSubmissions, useGradeSubmission, useInstructorAssignments } from '@/hooks/useCommunication';
import type { AssignmentItem } from '@/lib/api/communication';

/** "Giao tiếp > Bài tập" (19/09/2026, xây mới) — danh sách bài tập tự luận trên mọi khóa, chấm
 * điểm + phản hồi thủ công (khác Quiz tự chấm). Tạo bài tập mới thực hiện ngay trong trình soạn
 * Chương trình giảng dạy (nút "+ Bài tập" ở mỗi bài học), trang này chỉ để quản lý/chấm bài. */
export default function InstructorAssignmentsPage() {
  const [courseId, setCourseId] = useState<number | ''>('');
  const [activeAssignment, setActiveAssignment] = useState<AssignmentItem | null>(null);

  const { data: courses } = useInstructorCourseOptions();
  const { data: assignments, isLoading } = useInstructorAssignments(courseId || undefined);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">Bài tập</h1>
        <CourseFilterDropdown courses={courses ?? []} value={courseId} onChange={setCourseId} />
      </div>

      {isLoading && <div className="p-10 text-center text-sm text-ink-muted">Đang tải...</div>}
      {!isLoading && (!assignments || assignments.length === 0) && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-muted shadow-sm">
          Chưa có bài tập nào. Thêm bài tập ngay trong trình soạn Chương trình giảng dạy (nút &quot;+ Bài tập&quot;).
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {assignments?.map((a, idx) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setActiveAssignment(a)}
            className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface ${
              idx < assignments.length - 1 ? 'border-b border-line-soft' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink">{a.title}</p>
              <p className="truncate text-[12px] text-ink-muted">{a.courseTitle} · {a.lessonTitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[12px]">
              {a.dueDate && <span className="text-ink-muted">Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>}
              <span className="rounded-full bg-line-soft px-2.5 py-1 font-semibold text-ink-muted">
                {a.gradedCount}/{a.submissionCount} đã chấm
              </span>
            </div>
          </button>
        ))}
      </div>

      {activeAssignment && (
        <SubmissionsModal assignment={activeAssignment} onClose={() => setActiveAssignment(null)} />
      )}
    </>
  );
}

function SubmissionsModal({ assignment, onClose }: { assignment: AssignmentItem; onClose: () => void }) {
  const { data: submissions, isLoading } = useAssignmentSubmissions(assignment.id);
  const grade = useGradeSubmission();
  const [drafts, setDrafts] = useState<Record<number, { score: string; feedback: string }>>({});

  const draftOf = (id: number, score: number | null, feedback: string | null) =>
    drafts[id] ?? { score: score != null ? String(score) : '', feedback: feedback ?? '' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
          <div>
            <p className="font-display text-[15px] font-bold text-ink">{assignment.title}</p>
            <p className="text-[12px] text-ink-muted">{assignment.courseTitle} · {assignment.lessonTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-ink-muted hover:text-gray-600">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <p className="text-sm text-ink-muted">Đang tải...</p>}
          {!isLoading && (!submissions || submissions.length === 0) && (
            <p className="text-sm text-ink-muted">Chưa có học viên nào nộp bài.</p>
          )}
          <div className="flex flex-col gap-3">
            {submissions?.map((s) => {
              const draft = draftOf(s.id, s.score, s.feedback);
              return (
                <div key={s.id} className="rounded-lg border border-line p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-ink">{s.studentName}</span>
                    <span className="text-[11.5px] text-ink-muted">{new Date(s.submittedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {s.textContent && <p className="mb-2 whitespace-pre-line text-[13px] text-ink">{s.textContent}</p>}
                  {s.fileUrl && (
                    <a href={s.fileUrl} target="_blank" rel="noreferrer" className="mb-2 inline-block text-[12.5px] font-semibold text-accent-dark hover:underline">
                      📎 {s.fileName ?? 'Tệp đính kèm'}
                    </a>
                  )}
                  <div className="flex items-end gap-2 border-t border-line-soft pt-2">
                    <div className="w-20">
                      <label className="block text-[11px] font-semibold text-ink-muted">Điểm{assignment.maxScore ? `/${assignment.maxScore}` : ''}</label>
                      <input
                        type="number"
                        value={draft.score}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...draft, score: e.target.value } }))}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-[13px] focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-ink-muted">Phản hồi</label>
                      <input
                        type="text"
                        value={draft.feedback}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...draft, feedback: e.target.value } }))}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-[13px] focus:border-accent focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={grade.isPending}
                      onClick={() =>
                        grade.mutate({
                          submissionId: s.id,
                          score: draft.score.trim() ? Number(draft.score) : null,
                          feedback: draft.feedback,
                        })
                      }
                      className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
                    >
                      Lưu
                    </button>
                  </div>
                  {s.gradedAt && (
                    <p className="mt-1.5 text-[11.5px] text-success-ink">
                      Đã chấm: {s.score}{assignment.maxScore ? `/${assignment.maxScore}` : ''} điểm
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
