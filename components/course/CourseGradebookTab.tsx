'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { Trophy, AlertTriangle } from 'lucide-react';
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
  const { data, isLoading, error } = useQuery<GradebookResponse>({
    queryKey: ['student', 'gradebook', courseId],
    queryFn: async () => {
      return await api.get<GradebookResponse>(`/api/v1/student/courses/${courseId}/gradebook`);
    }
  });

  if (isLoading) return <div className="py-10 text-center"><Spinner className="mx-auto" /></div>;
  if (error) return <div className="py-10 text-center text-danger">Lỗi khi tải bảng điểm.</div>;

  // B1 — bài làm gần nhất lên đầu; quiz chưa làm lần nào (không có latestSubmittedAt) xuống cuối.
  const quizzes = [...(data?.quizzes || [])].sort((a, b) => {
    if (!a.latestSubmittedAt) return 1;
    if (!b.latestSubmittedAt) return -1;
    return new Date(b.latestSubmittedAt).getTime() - new Date(a.latestSubmittedAt).getTime();
  });

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
          <tbody className="divide-y divide-line">
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
                    <Link
                      href={`/exam/${quiz.quizId}/history?attemptId=${quiz.latestAttemptId}`}
                      className="text-accent font-semibold text-sm hover:underline"
                    >
                      Xem lịch sử ({quiz.attemptCount} lần)
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
