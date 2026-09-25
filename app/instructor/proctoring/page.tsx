'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyCourses } from '@/hooks/useCourses';
import { useProctoredQuizzes } from '@/hooks/useProctoring';
import { EyeIcon } from '@/components/instructor/SidebarIcons';

/** UC-ANTICHEAT (25/09/2026) — "Giám sát thi": chọn khoá học → danh sách quiz có bật giám sát
 * AI, kèm tổng lượt thi và số lượt rủi ro cao. Panel khoanh vùng + border nhẹ (`.card`,
 * `border-line`), màu theo token có sẵn (`text-ink`/`text-ink-muted`/`text-accent`), không phối
 * nhiều màu — đúng quy tắc thiết kế chung của dự án. */
export default function ProctoringLandingPage() {
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: coursesPage } = useMyCourses({ size: 100 });
  const courses = coursesPage?.content ?? [];
  const { data: quizzes, isLoading } = useProctoredQuizzes(courseId || undefined);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <EyeIcon className="h-6 w-6 text-accent" /> Giám sát thi
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Xem lại bằng chứng và cảnh báo AI cho các bài thi có bật giám sát (Anti-Cheat).
          </p>
        </div>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-accent"
        >
          <option value="">Chọn khoá học...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <div className="card p-8 text-center text-sm text-ink-muted">
          Chọn 1 khoá học ở trên để xem danh sách bài thi có bật giám sát.
        </div>
      ) : isLoading ? (
        <div className="card p-8 text-center text-sm text-ink-muted">Đang tải...</div>
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted">
          Khoá học này chưa có bài thi nào bật giám sát AI (isProctored).
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <Link
              key={q.quizId}
              href={`/instructor/proctoring/${q.quizId}`}
              className="card-interactive p-4 flex flex-col gap-3 no-underline"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink text-sm leading-snug">
                  {q.title || `Bài thi #${q.quizId}`}
                </h3>
                <span className="badge shrink-0 text-[10px]">{q.quizType}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>{q.attemptCount} lượt thi</span>
                {q.highRiskCount > 0 ? (
                  <span className="font-semibold text-danger">⚠ {q.highRiskCount} rủi ro cao</span>
                ) : (
                  <span className="text-success">Không có rủi ro cao</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
