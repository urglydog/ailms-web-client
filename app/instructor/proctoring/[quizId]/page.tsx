'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProctoredAttempts } from '@/hooks/useProctoring';
import { ArrowLeftIcon } from '@/components/instructor/SidebarIcons';

const parseDate = (d: string | number[]) => {
  if (Array.isArray(d)) {
    return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0);
  }
  return new Date(d);
};

const RISK_STYLE: Record<string, string> = {
  LOW: 'text-success border-success/30 bg-success/5',
  MEDIUM: 'text-amber-600 border-amber-300 bg-amber-50',
  HIGH: 'text-danger border-danger/30 bg-danger/5',
};

/** UC-ANTICHEAT — danh sách lượt thi của 1 quiz có bật giám sát, badge màu theo `aiRiskLevel`. */
export default function ProctoringQuizAttemptsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = Number(params.quizId);
  const { data: attempts, isLoading } = useProctoredAttempts(quizId);

  return (
    <>
      <button
        onClick={() => router.push('/instructor/proctoring')}
        className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline mb-4"
      >
        <ArrowLeftIcon /> Danh sách bài thi
      </button>

      <h1 className="font-display text-xl font-bold text-ink mb-4">Lượt thi — Bài thi #{quizId}</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase text-ink-muted border-b border-line">
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Nộp lúc</th>
              <th className="px-4 py-3 text-center">Vi phạm</th>
              <th className="px-4 py-3 text-center">Mức rủi ro AI</th>
              <th className="px-4 py-3 text-center">Video</th>
              <th className="px-4 py-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
            ) : !attempts || attempts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Chưa có lượt thi nào đã nộp.</td></tr>
            ) : (
              attempts.map((a) => (
                <tr key={a.attemptId} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{a.studentName}</div>
                    <div className="text-xs text-ink-muted">{a.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{parseDate(a.submittedAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-center font-semibold text-ink">{a.violationCount}</td>
                  <td className="px-4 py-3 text-center">
                    {a.aiRiskLevel ? (
                      <span className={`badge border ${RISK_STYLE[a.aiRiskLevel] || ''}`}>{a.aiRiskLevel}</span>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.hasRecording ? <span className="text-success text-xs font-semibold">Có</span> : <span className="text-xs text-ink-muted">Không</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/instructor/proctoring/attempts/${a.attemptId}`} className="text-accent text-sm font-semibold hover:underline">
                      Xem bằng chứng
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
