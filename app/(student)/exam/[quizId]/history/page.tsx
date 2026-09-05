'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuizHistory, useAttemptDetail } from '@/hooks/useQuizzes';
import { ApiError } from '@/lib/api/client';

export default function AttemptHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = typeof params?.quizId === 'string' ? Number(params.quizId) : 0;

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  const { data: history, isLoading: isLoadingHistory, error: historyError } = useQuizHistory(quizId);
  const { data: attemptDetail, isLoading: isLoadingDetail } = useAttemptDetail(selectedAttemptId || 0);

  if (!quizId) return <div className="p-8 text-center">Mã bài thi không hợp lệ</div>;

  return (
    <div className="min-h-dvh bg-surface p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
          <h1 className="text-2xl font-bold">Lịch sử làm bài thi</h1>
          <button onClick={() => router.back()} className="text-sm font-semibold text-accent hover:underline">
            ← Quay lại
          </button>
        </div>

        {historyError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {historyError instanceof ApiError ? historyError.message : 'Có lỗi xảy ra khi tải lịch sử'}
          </div>
        ) : isLoadingHistory ? (
          <div className="text-center text-ink-muted py-8">Đang tải lịch sử...</div>
        ) : !history || history.length === 0 ? (
          <div className="text-center text-ink-muted py-8 bg-white border border-gray-200 rounded-md shadow-sm">
            Bạn chưa có lượt làm bài nào cho bài thi này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h2 className="font-bold text-lg">Các lần thử</h2>
              {history.map((h, idx) => (
                <div 
                  key={h.id} 
                  onClick={() => setSelectedAttemptId(h.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAttemptId === h.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">Lần {history.length - idx}</span>
                    <span className="text-xs text-ink-muted">{new Date(h.submittedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {h.score.toFixed(1)} / 10
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    Đúng: {h.correctCount}/{h.totalQuestions} câu
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              {selectedAttemptId ? (
                isLoadingDetail ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                    Đang tải chi tiết bài làm...
                  </div>
                ) : attemptDetail ? (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                      <h2 className="font-bold text-lg">Chi tiết bài làm</h2>
                      <p className="text-sm text-ink-muted">Điểm số: <strong className="text-blue-600">{attemptDetail.score.toFixed(1)}</strong></p>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      {attemptDetail.details.map((q, qIdx) => (
                        <div key={q.questionId} className="space-y-3">
                          <h3 className="font-bold text-sm flex gap-2">
                            <span className="w-6 h-6 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                              {qIdx + 1}
                            </span>
                            {q.content}
                          </h3>
                          
                          <div className="ml-8 space-y-2">
                            {q.options.map(opt => {
                              const isSelected = q.selectedOptionId === opt.id;
                              const isCorrectAnswer = q.correctOptionId === opt.id;
                              // Chế độ cho phép xem lại: correctOptionId != null
                              const showCorrectness = q.correctOptionId !== null;
                              
                              let bgClass = "bg-white border-gray-200";
                              let textClass = "text-gray-700";
                              let icon = null;

                              if (showCorrectness) {
                                if (isCorrectAnswer && isSelected) {
                                  bgClass = "bg-green-50 border-green-200";
                                  textClass = "text-green-800 font-medium";
                                  icon = "✓";
                                } else if (isCorrectAnswer) {
                                  bgClass = "bg-green-50 border-green-200 border-dashed";
                                  textClass = "text-green-700";
                                  icon = "✓ (Đáp án đúng)";
                                } else if (isSelected) {
                                  bgClass = "bg-red-50 border-red-200";
                                  textClass = "text-red-800 font-medium";
                                  icon = "✗ (Bạn chọn)";
                                }
                              } else {
                                if (isSelected) {
                                  bgClass = "bg-blue-50 border-blue-200";
                                  textClass = "text-blue-800 font-medium";
                                  icon = "(Bạn chọn)";
                                }
                              }

                              return (
                                <div key={opt.id} className={`p-3 text-sm border rounded-md flex justify-between items-center ${bgClass} ${textClass}`}>
                                  <span>{opt.content}</span>
                                  {icon && <span className="text-xs font-bold">{icon}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-red-500 shadow-sm">
                    Không tải được chi tiết
                  </div>
                )
              ) : (
                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-12 text-center text-ink-muted flex flex-col items-center justify-center h-full min-h-[300px]">
                  <p>Chọn một lần làm bài ở cột bên trái để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
