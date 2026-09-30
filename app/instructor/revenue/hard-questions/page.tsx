'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { Pagination } from '@/components/ui/Pagination';
import { useHardQuestions, useInstructorCourseOptions } from '@/hooks/useDashboard';

type Severity = 'all' | 'critical' | 'warning';
type SortBy = 'wrongRate' | 'totalAnswers';

const PAGE_SIZE = 10;

function severityColor(percent: number): string {
  return percent >= 80 ? 'bg-red-500' : 'bg-amber-500';
}

/** "Hiệu suất" > Câu hỏi khó (29/09/2026, xây mới; 30/09/2026 viết lại — bỏ BarChart ngang, đổi
 * sang Bảng Phân Tích Hành Động có phân trang/lọc: nội dung câu hỏi quá dài để làm nhãn trục,
 * mục tiêu thật của giảng viên là TÌM và SỬA câu có vấn đề, không phải ngắm biểu đồ). Câu hỏi
 * quiz có tỷ lệ trả lời sai > 60% (đã lọc ngưỡng mẫu tối thiểu ở BE, chống thiên lệch cỡ mẫu nhỏ). */
export default function HardQuestionsPage() {
  const { data: rows, isLoading } = useHardQuestions();
  const { data: courses } = useInstructorCourseOptions();
  const [courseId, setCourseId] = useState<number | ''>('');
  const [severity, setSeverity] = useState<Severity>('all');
  const [sortBy, setSortBy] = useState<SortBy>('wrongRate');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let result = rows;
    if (courseId !== '') result = result.filter((r) => r.courseId === courseId);
    if (severity === 'critical') result = result.filter((r) => r.wrongRatePercent >= 80);
    if (severity === 'warning') result = result.filter((r) => r.wrongRatePercent >= 60 && r.wrongRatePercent < 80);
    return [...result].sort((a, b) =>
      sortBy === 'wrongRate' ? b.wrongRatePercent - a.wrongRatePercent : b.totalAnswers - a.totalAnswers,
    );
  }, [rows, courseId, severity, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const worst = rows && rows.length > 0 ? rows[0] : null;

  const handleFilterChange = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Câu hỏi khó</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">
          Câu hỏi có tỷ lệ học viên trả lời sai trên 60% — có thể nội dung bài giảng chưa rõ, hoặc câu hỏi/đáp án cần xem lại.
        </p>
      </div>

      {worst && (
        <InsightCallout tone="warning">
          {rows?.length ?? 0} câu hỏi đang vượt ngưỡng 60% sai — ưu tiên xem lại câu &quot;{worst.content}&quot; ({worst.wrongRatePercent.toFixed(0)}% sai, {worst.courseTitle}).
        </InsightCallout>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={courseId}
          onChange={(e) => handleFilterChange(() => setCourseId(e.target.value ? Number(e.target.value) : ''))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Tất cả khóa học</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => handleFilterChange(() => setSeverity(e.target.value as Severity))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 focus:border-cyan-400 focus:outline-none"
        >
          <option value="all">Mọi mức độ</option>
          <option value="critical">≥ 80% — Báo động đỏ</option>
          <option value="warning">60–79% — Cảnh báo</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => handleFilterChange(() => setSortBy(e.target.value as SortBy))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 focus:border-cyan-400 focus:outline-none"
        >
          <option value="wrongRate">Sắp xếp: Tỷ lệ sai</option>
          <option value="totalAnswers">Sắp xếp: Số lượt trả lời</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="grid min-w-[820px] grid-cols-[1.6fr_1fr_110px_160px_130px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
            <span>Câu hỏi</span>
            <span>Khóa học / Bài học</span>
            <span>Lượt trả lời</span>
            <span>Tỷ lệ sai</span>
            <span>Thao tác</span>
          </div>

          {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
          {!isLoading && pageRows.length === 0 && (
            <div className="p-10 text-center text-sm text-gray-500">
              {rows && rows.length > 0
                ? 'Không có câu hỏi nào khớp bộ lọc đang chọn.'
                : 'Chưa có câu hỏi nào vượt ngưỡng 60% trả lời sai (với đủ mẫu học viên) — bài giảng của bạn đang ổn.'}
            </div>
          )}

          {pageRows.map((row, idx) => (
            <div
              key={row.questionId}
              className={`grid min-w-[820px] grid-cols-[1.6fr_1fr_110px_160px_130px] items-center gap-3 px-4 py-2.5 text-[13px] ${
                idx < pageRows.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="truncate font-semibold text-gray-900" title={row.content}>{row.content}</span>
              <span className="truncate text-gray-600">
                {row.courseTitle}
                {row.lessonTitle ? ` · ${row.lessonTitle}` : ''}
              </span>
              <span className="text-gray-500">{row.totalAnswers}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${severityColor(row.wrongRatePercent)}`} style={{ width: `${row.wrongRatePercent}%` }} />
                </div>
                <span className={`text-[12px] font-bold ${row.wrongRatePercent >= 80 ? 'text-red-600' : 'text-amber-600'}`}>
                  {row.wrongRatePercent.toFixed(0)}%
                </span>
              </div>
              <Link
                href={`/instructor/courses/${row.courseId}/edit/materials?inspect=${row.materialGenerationId}`}
                className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-center text-[12px] font-bold text-cyan-700 no-underline hover:bg-cyan-100"
              >
                Xem & sửa
              </Link>
            </div>
          ))}
        </div>

        {filtered.length > PAGE_SIZE && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="px-4 pb-3" />
        )}
      </div>
    </>
  );
}
