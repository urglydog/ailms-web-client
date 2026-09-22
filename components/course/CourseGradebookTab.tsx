'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Trophy, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';

interface GradebookResponse {
  courseId: number;
  courseTitle: string;
  quizzes: QuizGradeDto[];
}

interface QuizGradeDto {
  quizId: number;
  quizTitle: string;
  isOfficial: boolean;
  isDeleted: boolean;
  location: string;
  maxAttempts: number | null;
  attemptCount: number;
  highestScore: number;
  latestScore: number;
  latestSubmittedAt: string;
  latestAttemptId: number;
  passed: boolean;
  attempts: AttemptDto[];
}

interface AttemptDto {
  id: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export function CourseGradebookTab({ courseId }: { courseId: number }) {
  const [historyQuiz, setHistoryQuiz] = useState<QuizGradeDto | null>(null);
  const [modalEntered, setModalEntered] = useState(false);

  useEffect(() => {
    if (historyQuiz) {
      const id = requestAnimationFrame(() => setModalEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setModalEntered(false);
  }, [historyQuiz]);

  const { data, isLoading, error } = useQuery<GradebookResponse>({
    queryKey: ['student', 'gradebook', courseId],
    queryFn: async () => {
      return await api.get<GradebookResponse>(`/api/v1/student/courses/${courseId}/gradebook`);
    }
  });

  if (isLoading) return <div className="py-10 text-center"><Spinner className="mx-auto" /></div>;
  if (error) return <div className="py-10 text-center text-danger">Lỗi khi tải bảng điểm.</div>;

  const quizzes = data?.quizzes || [];

  if (quizzes.length === 0) {
    return (
      <div className="py-12 text-center card bg-surface-hover border-dashed border-2 border-line rounded-card">
        <Trophy className="w-9 h-9 mx-auto mb-4 text-ink-faint" strokeWidth={1.5} />
        <h4 className="text-lg font-bold mb-2 text-ink">Chưa có dữ liệu bảng điểm</h4>
        <p className="text-ink-muted">Bạn chưa hoàn thành bài tập nào trong khóa học này. Hãy học và làm bài để xem kết quả tại đây nhé!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">Lịch sử làm bài thi & bài tập</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-line text-sm text-ink-muted uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Tên bài kiểm tra</th>
              <th className="py-3 px-4 font-semibold">Vị trí (Chương/Bài)</th>
              <th className="py-3 px-4 font-semibold">Loại</th>
              <th className="py-3 px-4 font-semibold">Điểm số cao nhất</th>
              <th className="py-3 px-4 font-semibold text-center">Lượt làm</th>
              <th className="py-3 px-4 font-semibold">Ngày nộp gần nhất</th>
              <th className="py-3 px-4 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {quizzes.map((quiz) => {
              return (
                <tr key={quiz.quizId} className="hover:bg-surface-hover transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-medium text-ink flex flex-col gap-1">
                      <div className="flex items-center gap-2">{quiz.quizTitle || 'Bài kiểm tra'}</div>
                      {quiz.isDeleted && (
                        <div className="p-2 mt-1 bg-star/10 border border-star/20 rounded-card text-star text-xs flex items-center gap-1.5 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          Bài tập/bài thi này đã được giảng viên lưu trữ.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-ink-muted font-medium">
                    {quiz.location}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {quiz.isOfficial ? (
                      <MaterialBadge tone="accent">Thi chính thức</MaterialBadge>
                    ) : (
                      <MaterialBadge tone="neutral">Ôn tập (AI)</MaterialBadge>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-extrabold ${quiz.highestScore >= 5 ? 'text-success' : 'text-danger'}`}>
                      {Number(quiz.highestScore).toFixed(2).replace(/\.?0+$/, '')}
                    </span>
                    <span className="text-ink-muted text-xs ml-1">/10</span>
                  </td>
                  <td className="py-4 px-4 text-center font-medium">
                    {quiz.attemptCount} / {quiz.maxAttempts && quiz.maxAttempts > 0 ? quiz.maxAttempts : '∞'}
                  </td>
                  <td className="py-4 px-4 text-sm text-ink-muted">
                    {quiz.latestSubmittedAt ? new Date(quiz.latestSubmittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : 'Đang làm'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button 
                      onClick={() => setHistoryQuiz(quiz)} 
                      className="text-accent font-semibold text-sm hover:underline"
                    >
                      Xem lịch sử ({quiz.attemptCount} lần)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Lịch sử Modal */}
      {historyQuiz && typeof window !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm transition-opacity duration-200 ${modalEntered ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setHistoryQuiz(null)}
        >
          <div
            className={`bg-surface-raised rounded-card w-full max-w-3xl flex flex-col max-h-[90vh] shadow-card-hover border border-line overflow-hidden transition-all duration-200 ${modalEntered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-line bg-surface">
              <div>
                <h3 className="text-xl font-bold text-ink">Lịch sử bài làm</h3>
                <p className="text-sm text-ink-muted mt-1">{historyQuiz.quizTitle}</p>
              </div>
              <button
                onClick={() => setHistoryQuiz(null)}
                className="p-2 hover:bg-surface-hover rounded-card text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface text-ink-muted font-semibold border-b border-line">
                  <tr>
                    <th className="px-6 py-4">Lần thi</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Kết quả</th>
                    <th className="px-6 py-4 text-center">Xem lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(!historyQuiz.attempts || historyQuiz.attempts.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-ink-muted">
                        Bạn chưa có lượt làm bài nào cho bài thi này.
                      </td>
                    </tr>
                  ) : (
                    historyQuiz.attempts.map((h, index) => (
                      <tr key={h.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4 font-bold text-ink">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-success flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
                          </div>
                          <div className="text-ink-muted text-xs mt-1">Đã nộp {new Date(h.submittedAt).toLocaleString('vi-VN')}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-lg text-ink">{h.correctCount} / {h.totalQuestions} <span className="text-sm font-normal text-ink-muted">câu</span></div>
                          <div className="text-xs font-semibold text-accent mt-1">{Number(h.score).toFixed(2).replace(/\.?0+$/, '')} điểm</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/exam/${historyQuiz.quizId}/history?attemptId=${h.id}`} className="text-accent font-semibold hover:underline">
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
