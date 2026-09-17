'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

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

  const { data, isLoading, error } = useQuery<GradebookResponse>({
    queryKey: ['student', 'gradebook', courseId],
    queryFn: async () => {
      return await api.get<GradebookResponse>(`/api/v1/student/courses/${courseId}/gradebook`);
    }
  });

  if (isLoading) return <div className="py-10 text-center"><Spinner className="mx-auto" /></div>;
  if (error) return <div className="py-10 text-center text-red-500">Lỗi khi tải bảng điểm.</div>;
  
  const quizzes = data?.quizzes || [];
  
  if (quizzes.length === 0) {
    return (
      <div className="py-12 text-center card bg-surface-hover border-dashed border-2">
        <div className="text-4xl mb-4">🏆</div>
        <h4 className="text-lg font-bold mb-2">Chưa có dữ liệu bảng điểm</h4>
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
                        <div className="p-2 mt-1 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center gap-1 w-fit">
                          ⚠️ Bài tập/bài thi này đã được giảng viên lưu trữ.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-ink-muted font-medium">
                    {quiz.location}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {quiz.isOfficial ? (
                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">Thi chính thức</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">Ôn tập (AI)</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-extrabold ${quiz.highestScore >= 5 ? 'text-green-600' : 'text-red-500'}`}>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Lịch sử bài làm</h3>
                <p className="text-sm text-gray-500 mt-1">{historyQuiz.quizTitle}</p>
              </div>
              <button
                onClick={() => setHistoryQuiz(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Lần thi</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Kết quả</th>
                    <th className="px-6 py-4 text-center">Xem lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!historyQuiz.attempts || historyQuiz.attempts.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Bạn chưa có lượt làm bài nào cho bài thi này.
                      </td>
                    </tr>
                  ) : (
                    historyQuiz.attempts.map((h, index) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-green-600">Đã xong</div>
                          <div className="text-gray-500 text-xs mt-1">Đã nộp {new Date(h.submittedAt).toLocaleString('vi-VN')}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-lg text-gray-900">{h.correctCount} / {h.totalQuestions} <span className="text-sm font-normal text-gray-500">câu</span></div>
                          <div className="text-xs font-semibold text-blue-600 mt-1">{Number(h.score).toFixed(2).replace(/\.?0+$/, '')} điểm</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/exam/${historyQuiz.quizId}/history?attemptId=${h.id}`} className="text-blue-600 font-semibold hover:underline">
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
