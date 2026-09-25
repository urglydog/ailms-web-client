'use client';

import Link from 'next/link';
import { Eye, Video, ShieldAlert } from 'lucide-react';
import { useProctoredAttempts } from '@/hooks/useProctoring';

const parseDate = (d: string | number[]) => {
  if (Array.isArray(d)) {
    return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0);
  }
  return new Date(d);
};

const RISK_BADGE: Record<string, string> = {
  HIGH: 'bg-danger/10 text-danger border-danger/30',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-300',
};

/** UC-ANTICHEAT (26/09/2026, rút gọn theo phản hồi thật) — 1 bảng phẳng, gộp mọi lượt thi có
 * giám sát của khoá học này (không còn màn "chọn quiz" trung gian). Chỉ highlight thứ đáng chú ý
 * (rủi ro MEDIUM/HIGH) — LOW/chưa có đánh giá thì để trống, không phải chữ giải thích dài dòng. */
export function CourseProctoringManager({ courseId }: { courseId: number }) {
  const { data: attempts, isLoading } = useProctoredAttempts(courseId);

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-raised text-xs uppercase text-ink-muted border-b border-line">
          <tr>
            <th className="px-4 py-3">Học viên</th>
            <th className="px-4 py-3">Bài thi</th>
            <th className="px-4 py-3">Nộp lúc</th>
            <th className="px-4 py-3 text-center" title="Số vi phạm ghi nhận">VP</th>
            <th className="px-4 py-3 text-center" title="Đánh giá rủi ro gian lận của AI">Rủi ro</th>
            <th className="px-4 py-3 text-center" title="Video bằng chứng">
              <Video className="w-3.5 h-3.5 inline" />
            </th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {isLoading ? (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
          ) : !attempts || attempts.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">Chưa có lượt thi nào ở các bài thi bật giám sát.</td></tr>
          ) : (
            attempts.map((a) => (
              <tr key={a.attemptId} className="hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{a.studentName}</div>
                  <div className="text-xs text-ink-muted">{a.studentEmail}</div>
                </td>
                <td className="px-4 py-3 text-ink">{a.quizTitle}</td>
                <td className="px-4 py-3 text-ink-muted">{parseDate(a.submittedAt).toLocaleString('vi-VN')}</td>
                <td className={`px-4 py-3 text-center ${a.violationCount > 0 ? 'font-semibold text-ink' : 'text-ink-faint'}`}>
                  {a.violationCount}
                </td>
                <td className="px-4 py-3 text-center">
                  {a.aiRiskLevel && RISK_BADGE[a.aiRiskLevel] ? (
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${RISK_BADGE[a.aiRiskLevel]}`}>
                      <ShieldAlert className="w-3 h-3" /> {a.aiRiskLevel}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Video className={`w-4 h-4 inline ${a.hasRecording ? 'text-accent' : 'text-ink-faint'}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/instructor/proctoring/attempts/${a.attemptId}`}
                    title="Xem"
                    className="inline-flex text-ink-muted hover:text-accent transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
