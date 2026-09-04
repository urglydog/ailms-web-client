'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gradebookApi, GradebookRes, AttemptInspectionRes } from '@/lib/api/gradebook';


export default function InstructorGradebookPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  const { data: gradebook, isLoading, error } = useQuery<GradebookRes>({
    queryKey: ['instructor-gradebook', courseId],
    queryFn: () => gradebookApi.getGradebook(courseId),
    enabled: !!courseId,
  });

  const { data: attemptDetail, isLoading: isLoadingAttempt } = useQuery<AttemptInspectionRes>({
    queryKey: ['instructor-attempt-detail', courseId, selectedAttemptId],
    queryFn: () => gradebookApi.getAttemptDetail(courseId, selectedAttemptId!),
    enabled: !!courseId && !!selectedAttemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-8 flex items-center justify-center">
        <div className="text-ink-muted animate-pulse font-medium">Đang tải Bảng điểm lớp học...</div>
      </div>
    );
  }

  if (error || !gradebook) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="card p-8 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-red-600 mb-2">Không thể tải Bảng điểm</h2>
          <p className="text-sm text-ink-muted mb-4">Bạn có thể không có quyền truy cập hoặc khóa học này chưa có dữ liệu.</p>
          <button 
            onClick={() => router.back()}
            className="bg-ink text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
              <button onClick={() => router.push('/instructor')} className="hover:underline">Giảng viên</button>
              <span>/</span>
              <span>Quản lý Bảng điểm</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Bảng Điểm Lớp Học: <span className="text-accent">{gradebook.courseTitle}</span>
            </h1>
          </div>
          <button 
            onClick={() => router.push(`/instructor/courses/${courseId}/materials`)}
            className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-gray-800 transition-all"
          >
            Quản lý Học liệu & Quiz
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 border-l-4 border-blue-500">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Tổng học viên ghi danh</div>
            <div className="text-3xl font-extrabold text-ink mt-2">{gradebook.totalStudents} <span className="text-sm font-normal text-ink-muted">học viên</span></div>
          </div>
          <div className="card p-6 border-l-4 border-emerald-500">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Điểm trung bình lớp</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">{gradebook.averageScore} <span className="text-sm font-normal text-ink-muted">/10</span></div>
          </div>
          <div className="card p-6 border-l-4 border-amber-500">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Tỷ lệ Đạt (Pass Rate)</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2">{gradebook.passRatePercentage}%</div>
          </div>
          <div className="card p-6 border-l-4 border-purple-500">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Tổng số lượt làm bài</div>
            <div className="text-3xl font-extrabold text-purple-600 mt-2">{gradebook.totalAttempts} <span className="text-sm font-normal text-ink-muted">lượt</span></div>
          </div>
        </div>

        {/* Gradebook Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface-hover">
            <h2 className="font-display font-bold text-lg text-ink">Danh Sách Bảng Điểm Chi Tiết</h2>
            {!gradebook.hasOfficialQuiz && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                ⚠️ Khóa học chưa xuất bản Quiz chính thức
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-ink-muted text-xs uppercase font-bold border-b border-line">
                <tr>
                  <th className="px-6 py-4">Học Viên</th>
                  <th className="px-6 py-4 text-center">Số Lượt Làm</th>
                  <th className="px-6 py-4 text-center">Điểm Cao Nhất</th>
                  <th className="px-6 py-4 text-center">Điểm Gần Nhất</th>
                  <th className="px-6 py-4">Thời Gian Nộp</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gradebook.students.map((student) => (
                  <tr key={student.userId} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="text-ink font-bold">{student.fullName}</div>
                      <div className="text-xs text-ink-muted">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {student.attemptCount > 0 ? (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          {student.attemptCount} lượt
                        </span>
                      ) : (
                        <span className="text-ink-muted">Chưa làm</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-base">
                      {student.attemptCount > 0 ? (
                        <span className={student.passed ? 'text-emerald-600' : 'text-red-500'}>
                          {student.highestScore}
                        </span>
                      ) : (
                        <span className="text-ink-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {student.attemptCount > 0 ? student.latestScore : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted">
                      {student.latestSubmittedAt ? new Date(student.latestSubmittedAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.attemptCount === 0 ? (
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">Chưa tham gia</span>
                      ) : student.passed ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">Đạt (Passed) ✓</span>
                      ) : (
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">Chưa đạt ✕</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.latestAttemptId ? (
                        <button
                          onClick={() => setSelectedAttemptId(student.latestAttemptId)}
                          className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent-dark transition-all flex items-center gap-1 ml-auto"
                        >
                          🔍 Soi Bài Làm
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted italic">Không có bài nộp</span>
                      )}
                    </td>
                  </tr>
                ))}
                {gradebook.students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-ink-muted">
                      Chưa có học viên nào ghi danh khóa học này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attempt Inspection Modal */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl bg-white rounded-2xl my-8">
            <div className="flex justify-between items-center border-b border-line pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span>🔍 Chi Tiết Bài Làm Học Viên:</span>
                  <span className="text-accent">{attemptDetail?.studentName}</span>
                </h3>
                <p className="text-xs text-ink-muted">{attemptDetail?.studentEmail} • Nộp lúc: {attemptDetail?.submittedAt ? new Date(attemptDetail.submittedAt).toLocaleString('vi-VN') : ''}</p>
              </div>
              <button 
                onClick={() => setSelectedAttemptId(null)}
                className="text-ink-muted hover:text-ink font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            {isLoadingAttempt ? (
              <div className="py-12 text-center text-ink-muted animate-pulse font-medium">Đang nạp chi tiết bài nộp...</div>
            ) : attemptDetail ? (
              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                {/* Result Overview */}
                <div className="bg-surface p-4 rounded-xl flex items-center justify-around border border-line">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-ink-muted uppercase">Điểm số</div>
                    <div className="text-2xl font-extrabold text-accent">{attemptDetail.score}/10</div>
                  </div>
                  <div className="h-8 w-px bg-line"></div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-ink-muted uppercase">Số câu đúng</div>
                    <div className="text-2xl font-extrabold text-emerald-600">{attemptDetail.correctCount}/{attemptDetail.totalQuestions}</div>
                  </div>
                </div>

                {/* Answers Inspection List */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-ink uppercase tracking-wider">Chi Tiết Lựa Chọn Từng Câu Hỏi</h4>
                  {attemptDetail.answers.map((q, idx) => (
                    <div key={q.questionId} className={`p-4 rounded-xl border-l-4 ${q.isCorrect ? 'border-emerald-500 bg-emerald-50/20' : 'border-red-500 bg-red-50/20'} border border-line`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-ink">Câu {idx + 1}: {q.questionContent}</div>
                        {q.isCorrect ? (
                          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Đúng ✓</span>
                        ) : (
                          <span className="text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">Sai ✕</span>
                        )}
                      </div>

                      <div className="space-y-2 mt-3">
                        {q.options.map(opt => {
                          const isSelected = q.selectedOptionId === opt.id;
                          const isCorrect = q.correctOptionId === opt.id || opt.isCorrect;

                          let style = "p-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between ";
                          if (isCorrect && isSelected) {
                            style += "border-emerald-500 bg-emerald-100 text-emerald-900 font-bold";
                          } else if (isCorrect) {
                            style += "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold";
                          } else if (isSelected) {
                            style += "border-red-400 bg-red-100 text-red-900 font-bold";
                          } else {
                            style += "border-line bg-surface text-ink-muted opacity-70";
                          }

                          return (
                            <div key={opt.id} className={style}>
                              <span>{opt.content}</span>
                              <div className="flex items-center gap-1 text-[11px]">
                                {isSelected && <span className="bg-ink text-white px-2 py-0.5 rounded font-bold">Lựa chọn của học viên</span>}
                                {isCorrect && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">Đáp án đúng ✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-line text-right">
              <button 
                onClick={() => setSelectedAttemptId(null)}
                className="bg-ink text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-gray-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
