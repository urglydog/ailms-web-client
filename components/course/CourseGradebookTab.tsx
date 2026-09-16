'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

interface GradebookEntry {
  id: number;
  quizId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  quizType: string;
  quizTitle: string;
}

export function CourseGradebookTab({ courseId }: { courseId: number }) {
  const { data: gradebook, isLoading, error } = useQuery<GradebookEntry[]>({
    queryKey: ['student', 'gradebook', courseId],
    queryFn: async () => {
      return await api.get<GradebookEntry[]>(`/api/v1/student/courses/${courseId}/gradebook`);
    }
  });

  if (isLoading) return <div className="py-10 text-center"><Spinner className="mx-auto" /></div>;
  if (error) return <div className="py-10 text-center text-red-500">Lỗi khi tải bảng điểm.</div>;
  if (!gradebook || gradebook.length === 0) {
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
              <th className="py-3 px-4 font-semibold">Điểm số</th>
              <th className="py-3 px-4 font-semibold">Tỉ lệ đúng</th>
              <th className="py-3 px-4 font-semibold">Ngày làm</th>
              <th className="py-3 px-4 font-semibold text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {gradebook.map((entry) => (
              <tr key={entry.id} className="hover:bg-surface-hover transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-ink flex items-center gap-2">
                    {entry.quizTitle || 'Bài kiểm tra'}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm">
                  {entry.quizType === 'OFFICIAL_EXAM' ? (
                    <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">Thi chính thức</span>
                  ) : (
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">Ôn tập (AI)</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className={`font-extrabold ${entry.score >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(entry.score).toFixed(2).replace(/\.?0+$/, '')}
                  </span>
                  <span className="text-ink-muted text-xs ml-1">/10</span>
                </td>
                <td className="py-4 px-4 text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{entry.correctCount}</span>/{entry.totalQuestions}
                </td>
                <td className="py-4 px-4 text-sm text-ink-muted">
                  {new Date(entry.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="py-4 px-4 text-right">
                  {entry.status === 'COMPLETED' ? (
                    <Link href={`/exam/${entry.quizId}?tab=history`} className="text-accent font-semibold text-sm hover:underline">
                      Xem kết quả
                    </Link>
                  ) : (
                    <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                      Đang làm
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
