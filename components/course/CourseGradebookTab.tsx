'use client';

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
              <th className="py-3 px-4 font-semibold">Loại</th>
              <th className="py-3 px-4 font-semibold">Điểm số cao nhất</th>
              <th className="py-3 px-4 font-semibold">Lần làm gần nhất</th>
              <th className="py-3 px-4 font-semibold text-right">Chi tiết</th>
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
                  <td className="py-4 px-4 text-sm text-ink-muted">
                    {quiz.latestSubmittedAt ? new Date(quiz.latestSubmittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : 'Đang làm'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link href={`/exam/${quiz.quizId}?tab=history`} className="text-accent font-semibold text-sm hover:underline">
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
