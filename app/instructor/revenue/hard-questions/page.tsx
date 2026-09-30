'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { useHardQuestions } from '@/hooks/useDashboard';

const LABEL_MAX_LEN = 25;

function truncate(text: string): string {
  return text.length > LABEL_MAX_LEN ? `${text.slice(0, LABEL_MAX_LEN)}…` : text;
}

/** "Hiệu suất" > Câu hỏi khó (29/09/2026, xây mới; viết lại phần hiển thị theo plan redesign —
 * thay bảng phẳng bằng biểu đồ top 10 + insight trỏ thẳng câu tệ nhất): câu hỏi quiz có tỷ lệ
 * trả lời sai > 60% (đã lọc ngưỡng mẫu tối thiểu ở BE, chống thiên lệch cỡ mẫu nhỏ). */
export default function HardQuestionsPage() {
  const { data: rows, isLoading } = useHardQuestions();

  const chartData = useMemo(() => {
    if (!rows) return [];
    return rows.slice(0, 10).map((r) => ({ ...r, shortLabel: truncate(r.content) }));
  }, [rows]);

  const worst = rows && rows.length > 0 ? rows[0] : null;
  const totalHardCount = rows?.length ?? 0;

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
          {totalHardCount} câu hỏi đang vượt ngưỡng 60% sai — ưu tiên xem lại câu &quot;{worst.content}&quot; ({worst.wrongRatePercent.toFixed(0)}% sai, {worst.courseTitle}).
        </InsightCallout>
      )}

      {!isLoading && chartData.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-[15px] font-bold text-gray-900">Top {chartData.length} câu hỏi sai nhiều nhất</h2>
          <div className="w-full min-w-0" style={{ height: chartData.length * 34 + 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="shortLabel" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Tỷ lệ sai']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.content ?? ''}
                />
                <Bar dataKey="wrongRatePercent" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
