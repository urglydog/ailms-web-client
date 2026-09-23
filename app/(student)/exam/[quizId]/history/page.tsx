'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useQuizHistory, useAttemptDetail } from '@/hooks/useQuizzes';
import { ApiError } from '@/lib/api/client';
import { Tooltip } from '@/components/ui/Tooltip';
import { Hash, Calendar, Trophy, CheckCheck, CheckCircle2, XCircle, MinusCircle, type LucideIcon } from 'lucide-react';

function AttemptHistoryContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = typeof params?.quizId === 'string' ? Number(params.quizId) : 0;
  const initialAttemptId = searchParams.get('attemptId') ? Number(searchParams.get('attemptId')) : null;

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(initialAttemptId);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  const { data: history, isLoading: isLoadingHistory, error: historyError } = useQuizHistory(quizId);
  const { data: attemptDetail, isLoading: isLoadingDetail } = useAttemptDetail(selectedAttemptId || 0);

  useEffect(() => {
    if (history && history.length > 0 && history[0] && !selectedAttemptId) {
      setSelectedAttemptId(history[0].id);
    }
  }, [history, selectedAttemptId]);

  if (!quizId) return <div className="p-8 text-center">Mã bài thi không hợp lệ</div>;

  const formatDate = (d: string | number[]) => {
    if (Array.isArray(d)) {
      return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0).toLocaleDateString('vi-VN');
    }
    return new Date(d).toLocaleDateString('vi-VN');
  };

  // Find current attempt info from history
  const currentAttempt = history?.find(h => h.id === selectedAttemptId);
  const currentAttemptIndex = history ? history.length - (history.findIndex(h => h.id === selectedAttemptId)) : 0;

  return (
    <div className="min-h-dvh bg-surface p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <div>
            <h1 className="text-lg font-bold">Lịch sử làm bài thi</h1>
            {currentAttempt && (
              <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                <Tooltip label="Lần">
                  <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {currentAttemptIndex}</span>
                </Tooltip>
                <Tooltip label="Ngày nộp">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(currentAttempt.submittedAt)}</span>
                </Tooltip>
                <Tooltip label="Điểm">
                  <span className="flex items-center gap-1 text-accent font-bold"><Trophy className="w-3.5 h-3.5" /> {Number(currentAttempt.score).toFixed(2).replace(/\.?0+$/, '')}/10</span>
                </Tooltip>
                <Tooltip label="Số câu đúng">
                  <span className="flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> {currentAttempt.correctCount}/{currentAttempt.totalQuestions}</span>
                </Tooltip>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Attempt selector dropdown */}
            {history && history.length > 1 && (
              <select
                value={selectedAttemptId || ''}
                onChange={e => setSelectedAttemptId(Number(e.target.value))}
                className="text-xs border border-line rounded-lg px-3 py-1.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {history.map((h, idx) => (
                  <option key={h.id} value={h.id}>
                    Lần {history.length - idx} — {Number(h.score).toFixed(1)}/10 ({h.correctCount}/{h.totalQuestions} câu)
                  </option>
                ))}
              </select>
            )}
            <button onClick={() => router.back()} className="text-xs font-semibold text-accent hover:underline whitespace-nowrap">
              ← Quay lại
            </button>
          </div>
        </div>

        {historyError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
            {historyError instanceof ApiError ? historyError.message : 'Có lỗi xảy ra khi tải lịch sử'}
          </div>
        ) : isLoadingHistory ? (
          <div className="text-center text-ink-muted py-8 text-sm">Đang tải lịch sử...</div>
        ) : !history || history.length === 0 ? (
          <div className="text-center text-ink-muted py-8 bg-white border border-line rounded-md shadow-sm text-sm">
            Bạn chưa có lượt làm bài nào cho bài thi này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Questions column - takes 2/3 */}
            <div className="md:col-span-2">
              {selectedAttemptId ? (
                isLoadingDetail ? (
                  <div className="bg-white border border-line rounded-lg p-8 text-center shadow-sm text-sm">
                    Đang tải chi tiết bài làm...
                  </div>
                ) : attemptDetail ? (() => {
                  const totalHistPages = Math.ceil(attemptDetail.details.length / historyPerPage);
                  const hStart = (historyPage - 1) * historyPerPage;
                  const hEnd = historyPage * historyPerPage;
                  return (
                  <div className="space-y-3">
                    {attemptDetail.details.slice(hStart, hEnd).map((q, qIdx) => {
                      const hasAnswer = q.selectedOptionIds && q.selectedOptionIds.length > 0;
                      const showCorrectness = q.isCorrect !== null && q.correctOptionIds && q.correctOptionIds.length > 0;
                      // Border: green if correct, red if wrong or unanswered, neutral if allowReview is false
                      const cardBorder = q.isCorrect === null ? 'border-line bg-white' : (q.isCorrect ? 'border-green-400 bg-green-50/30' : 'border-red-400 bg-red-50/30');

                      return (
                        <div key={q.questionId} id={`question-${q.questionId}`} className={`border-2 rounded-lg p-4 ${cardBorder}`}>
                          <h3 className="font-bold text-xs flex items-center gap-2 mb-2">
                            <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${q.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                              {hStart + qIdx + 1}
                            </span>
                            <span className="text-ink">{q.content}</span>
                            {q.isCorrect === true
                              ? <span className="ml-auto flex items-center gap-1 text-green-600 text-[10px] font-bold whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> Đúng</span>
                              : q.isCorrect === false && hasAnswer
                                ? <span className="ml-auto flex items-center gap-1 text-red-600 text-[10px] font-bold whitespace-nowrap"><XCircle className="w-3 h-3" /> Sai</span>
                                : q.isCorrect === false && !hasAnswer
                                  ? <span className="ml-auto flex items-center gap-1 text-red-600 text-[10px] font-bold whitespace-nowrap"><MinusCircle className="w-3 h-3" /> Bỏ trống</span>
                                  : <span className="ml-auto text-ink-muted text-[10px] font-bold whitespace-nowrap">{hasAnswer ? 'Đã trả lời' : 'Bỏ trống'}</span>
                            }
                          </h3>

                          <div className="ml-7 space-y-1.5">
                            {q.options.map(opt => {
                              const isSelected = q.selectedOptionIds?.includes(opt.id);
                              const isCorrectAnswer = showCorrectness && q.correctOptionIds?.includes(opt.id);

                              let optClass = "bg-white border-line text-ink-muted";
                              let Icon: LucideIcon | null = null;

                              if (showCorrectness) {
                                if (isCorrectAnswer && isSelected) {
                                  // Picked correct
                                  optClass = "bg-green-50 border-green-300 text-green-800 font-medium";
                                  Icon = CheckCircle2;
                                } else if (isCorrectAnswer) {
                                  // Correct but not picked
                                  optClass = "bg-green-50 border-green-300 border-dashed text-green-700";
                                  Icon = CheckCircle2;
                                } else if (isSelected) {
                                  // Picked wrong
                                  optClass = "bg-red-50 border-red-300 text-red-800 font-medium";
                                  Icon = XCircle;
                                }
                              } else {
                                if (isSelected) {
                                  optClass = "bg-accent/5 border-accent/20 text-accent-dark font-medium";
                                  Icon = MinusCircle;
                                }
                              }

                              return (
                                <div key={opt.id} className={`py-2 px-3 text-xs border rounded flex justify-between items-center ${optClass}`}>
                                  <span>{opt.content}</span>
                                  {Icon && <Icon className="w-3 h-3 ml-2 flex-shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {totalHistPages > 1 && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-line">
                        <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="px-3 py-1 border border-line rounded text-xs font-semibold disabled:opacity-50">Trang trước</button>
                        <span className="text-xs text-ink-muted">Trang {historyPage}/{totalHistPages}</span>
                        <button disabled={historyPage === totalHistPages} onClick={() => setHistoryPage(p => p + 1)} className="px-3 py-1 border border-line rounded text-xs font-semibold disabled:opacity-50">Trang sau</button>
                      </div>
                    )}
                  </div>
                  );
                })() : (
                  <div className="bg-white border border-line rounded-lg p-8 text-center text-red-500 shadow-sm text-sm">
                    Không tải được chi tiết
                  </div>
                )
              ) : (
                <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center text-ink-muted flex flex-col items-center justify-center h-full min-h-[300px] text-sm">
                  <p>Chọn một lần làm bài để xem chi tiết</p>
                </div>
              )}
            </div>

            {/* Matrix column - sticky sidebar, takes 1/3 */}
            <div className="md:col-span-1">
              {attemptDetail && (
                <div className="sticky top-24 w-full flex flex-col gap-3" style={{ maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}>
                  <div className="card p-3 shadow-lg border border-line">
                    <h4 className="text-xs font-bold mb-2 text-center text-ink-muted">Ma trận kết quả</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {attemptDetail.details.map((q, idx) => {
                        const isCorrect = q.isCorrect;
                        return (
                          <button
                            key={q.questionId}
                            onClick={() => {
                              const pageOfQuestion = Math.ceil((idx + 1) / historyPerPage);
                              setHistoryPage(pageOfQuestion);
                              setTimeout(() => document.getElementById(`question-${q.questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                            }}
                            className={`flex flex-col h-9 w-full rounded overflow-hidden text-[10px] font-bold border transition-colors ${historyPage === Math.ceil((idx + 1) / historyPerPage) ? 'ring-2 ring-accent/50' : 'border-line'} hover:opacity-80`}
                          >
                            <div className="h-[70%] w-full flex items-center justify-center bg-surface text-ink border-b border-line/50">
                              {idx + 1}
                            </div>
                            <div className={`h-[30%] w-full flex items-center justify-center text-white text-[8px] ${isCorrect === null ? (q.selectedOptionIds?.length ? 'bg-accent/80' : 'bg-surface text-ink-muted') : (isCorrect ? 'bg-green-500' : 'bg-red-500')}`}>
                              {isCorrect === null
                                ? (q.selectedOptionIds?.length ? <CheckCircle2 className="w-2.5 h-2.5" /> : <MinusCircle className="w-2.5 h-2.5" />)
                                : (isCorrect ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttemptHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <AttemptHistoryContent />
    </Suspense>
  );
}
