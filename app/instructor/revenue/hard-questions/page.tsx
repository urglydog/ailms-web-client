'use client';

import { useHardQuestions } from '@/hooks/useDashboard';

/** "Hiệu suất" > Câu hỏi khó (29/09/2026, xây mới — Sprint 3 mục 10): câu hỏi quiz có tỷ lệ trả
 * lời sai > 60% (đã lọc ngưỡng mẫu tối thiểu ở BE, chống thiên lệch cỡ mẫu nhỏ), gợi ý nội dung
 * bài giảng có thể đang khó hiểu hoặc câu hỏi/đáp án có vấn đề. */
export default function HardQuestionsPage() {
  const { data: rows, isLoading } = useHardQuestions();

  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Câu hỏi khó</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">
          Câu hỏi có tỷ lệ học viên trả lời sai trên 60% — có thể nội dung bài giảng chưa rõ, hoặc câu hỏi/đáp án cần xem lại.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[1.6fr_1fr_120px_110px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
            <span>Câu hỏi</span>
            <span>Khóa học / Bài học</span>
            <span>Số lượt trả lời</span>
            <span>Tỷ lệ sai</span>
          </div>

          {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
          {!isLoading && (!rows || rows.length === 0) && (
            <div className="p-10 text-center text-sm text-gray-500">
              Chưa có câu hỏi nào vượt ngưỡng 60% trả lời sai (với đủ mẫu học viên) — bài giảng của bạn đang ổn.
            </div>
          )}

          {rows?.map((row, idx) => (
            <div
              key={row.questionId}
              className={`grid min-w-[720px] grid-cols-[1.6fr_1fr_120px_110px] items-center gap-3 px-4 py-2.5 text-[13px] ${
                idx < rows.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="truncate font-semibold text-gray-900" title={row.content}>{row.content}</span>
              <span className="truncate text-gray-600">
                {row.courseTitle}
                {row.lessonTitle ? ` · ${row.lessonTitle}` : ''}
              </span>
              <span className="text-gray-500">{row.totalAnswers}</span>
              <span className="font-semibold text-red-600">{row.wrongRatePercent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
