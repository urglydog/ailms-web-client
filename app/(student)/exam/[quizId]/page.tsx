'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useStartQuiz, useSubmitQuiz, useExplainWrongAnswer, useQuizHistory } from '@/hooks/useQuizzes';
import { StartRes, SubmitRes } from '@/lib/api/quizzes';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function AntiCheatExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId;
  const title = searchParams.get('title') || 'Bài kiểm tra';
  const duration = searchParams.get('duration');
  const maxAttempts = searchParams.get('attempts');
  const questionCount = searchParams.get('count');
  const startTime = searchParams.get('start');
  const endTime = searchParams.get('end');
  const proctoredParam = searchParams.get('proctored');
  const isProctored = proctoredParam === 'true';
  const returnUrl = searchParams.get('returnUrl');

  const { data: history } = useQuizHistory(Number(quizId));

  const videoRef = useRef<HTMLVideoElement>(null);

  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isStarted, setIsStarted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Trạng thái AI
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'DETECTING' | 'FACE_FOUND' | 'NO_FACE'>('DETECTING');

  // Đồng hồ đếm ngược (giây)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lastViolationTime = useRef(0);
  const detectInterval = useRef<NodeJS.Timeout | null>(null);

  const { mutate: startQuiz, isPending: isStarting } = useStartQuiz();
  const { mutate: submitQuiz } = useSubmitQuiz();
  const { mutate: explainWrongAnswer } = useExplainWrongAnswer();
  const [attemptData, setAttemptData] = useState<StartRes | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitRes | null>(null);
  const [submitTime, setSubmitTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startTimeRef = useRef<Date | null>(null);

  // State for AI Explanations
  const [explanations, setExplanations] = useState<Record<number, { loading: boolean; text?: string }>>({});

  const handleExplain = (questionId: number, selectedOptionId: number | null) => {
    setExplanations(prev => ({ ...prev, [questionId]: { loading: true } }));
    explainWrongAnswer({ questionId, selectedOptionId }, {
      onSuccess: (data) => {
        setExplanations(prev => ({ ...prev, [questionId]: { loading: false, text: data.explanation } }));
      },
      onError: () => {
        setExplanations(prev => ({ ...prev, [questionId]: { loading: false, text: 'Có lỗi khi gọi AI. Vui lòng thử lại.' } }));
        toast.error('Có lỗi khi lấy giải thích từ AI.');
      }
    });
  };

  // Khởi tạo model
  useEffect(() => {
    if (!isProctored) {
      setIsModelLoaded(true);
      return;
    }
    const loadModels = async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        const MODEL_URL = '/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models", err);
        // Fallback for demo
        setIsModelLoaded(true);
      }
    };
    loadModels();
  }, [isProctored]);

  // Anti-Cheat: Track tab switching
  useEffect(() => {
    if (!isStarted || isSubmitting || !!result) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error('Phát hiện gian lận chuyển Tab quá 3 lần. Hệ thống tự động nộp bài!');
            // Delay slightly to allow toast to render
            setTimeout(() => submitExam(), 500);
          } else {
            toast.warning(`Cảnh báo gian lận (${newCount}/3): Bạn đã chuyển Tab. Hệ thống sẽ tự động nộp bài nếu vi phạm 3 lần!`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, isSubmitting, result]); // Omitting submitExam to avoid infinite re-renders if not memoized properly

  // Hàm nộp bài
  const submitExam = useCallback(() => {
    if (!attemptData || isSubmitting) return;
    setIsSubmitting(true);
    // Dừng timer khi nộp bài
    if (timerRef.current) clearInterval(timerRef.current);
    // Tính thời gian làm bài thực tế
    const elapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000) : 0;
    setElapsedSeconds(elapsed);
    submitQuiz({ attemptId: attemptData.attemptId, data: { answers } }, {
      onSuccess: (data) => {
        setResult(data);
        setSubmitTime(new Date());
        // Dừng stream
        if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      },
      onError: () => {
        toast.error('Có lỗi khi nộp bài. Vui lòng thử lại.');
        setIsSubmitting(false);
      }
    });
  }, [attemptData, answers, isSubmitting, submitQuiz, mediaStream]);

  // Hàm xử lý vi phạm với debounce (tránh trigger liên tục)
  const handleViolation = useCallback((reason: string) => {
    if (isSubmitting || result) return;
    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return; // Debounce 2 giây
    lastViolationTime.current = now;

    setViolationCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        toast.error('Bạn đã vi phạm quá 3 lần. Hệ thống tự động nộp bài!');
        submitExam();
      } else {
        toast.warning(`Cảnh báo vi phạm (${newCount}/3): ${reason}`);
      }
      return newCount;
    });
  }, [isSubmitting, result, submitExam]);

  // 1. Chống chuyển tab & Rời chuột khỏi màn hình
  useEffect(() => {
    if (!isStarted || result || !isProctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Chuyển tab hoặc thu nhỏ trình duyệt');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Mất tiêu điểm cửa sổ thi');
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Chỉ tính vi phạm nếu chuột rời khỏi cửa sổ browser đi sang màn hình khác / mép trên màn hình
      if (e.clientY <= 5) {
        handleViolation('Chuột rời khỏi khung hình thi (Nghi ngờ xem tài liệu)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isStarted, result, isProctored, handleViolation]);

  // 2. Face API Detection Loop
  useEffect(() => {
    if (!isProctored || !isStarted || !videoRef.current || !isModelLoaded || result) return;

    const video = videoRef.current;

    const startDetection = () => {
      if (detectInterval.current) clearInterval(detectInterval.current);

      detectInterval.current = setInterval(async () => {
        if (video.paused || video.ended) return;

        try {
          const faceapi = await import('@vladmandic/face-api');
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 })
          );

          if (detections.length === 0) {
            setFaceStatus('NO_FACE');
            handleViolation('Không phát hiện thấy khuôn mặt trong Camera');
          } else if (detections.length > 1) {
            setFaceStatus('NO_FACE');
            handleViolation('Phát hiện có nhiều hơn 1 người trong khung hình');
          } else {
            setFaceStatus('FACE_FOUND');
          }
        } catch {
          // ignore detection error
        }
      }, 2000); // Quét mỗi 2s
    };

    video.addEventListener('play', startDetection);
    return () => {
      video.removeEventListener('play', startDetection);
      if (detectInterval.current) clearInterval(detectInterval.current);
    };
  }, [isStarted, isProctored, isModelLoaded, result, handleViolation]);

  // Yêu cầu bật Camera (nếu proctored)
  const startExam = async () => {
    if (isProctored) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaStream(stream);
      } catch {
        toast.error('Bạn phải cấp quyền sử dụng Camera để làm bài thi này!');
        return;
      }
    }

    startQuiz(Number(quizId), {
      onSuccess: (data) => {
        setAttemptData(data);
        setIsStarted(true);
        if (isProctored) {
          toast.success('Bắt đầu làm bài. Vui lòng không chuyển tab!');
        } else {
          toast.success('Bắt đầu làm bài!');
        }
      },
      onError: (err: unknown) => {
        const error = err as { message?: string; response?: { data?: { message?: string; detail?: string } } };
        toast.error(error.message || error.response?.data?.message || error.response?.data?.detail || 'Không thể tải bài thi.');
        if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      }
    });
  };

  // Đồng hồ đếm ngược tuyệt đối dựa vào startedAt
  useEffect(() => {
    const examDurationMinutes = duration ? Number(duration) : null;
    if (!isStarted || !examDurationMinutes || result || !attemptData?.startedAt) return;

    const startTimeMs = new Date(attemptData.startedAt).getTime();
    const durationMs = examDurationMinutes * 60 * 1000;
    const expireTimeMs = startTimeMs + durationMs;

    startTimeRef.current = new Date(startTimeMs);

    const updateTimer = () => {
      const remainingMs = expireTimeMs - Date.now();
      if (remainingMs <= 1000) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(0);
        toast.warning('⏱ Hết giờ! Bài thi đã được tự động nộp.');
        setTimeout(() => submitExam(), 300);
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    };

    updateTimer(); // Call immediately
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, duration, result, attemptData?.startedAt]);

  // Gắn stream
  useEffect(() => {
    if (isStarted && videoRef.current && mediaStream && !result) {
      videoRef.current.srcObject = mediaStream;
    }
    // Dừng stream khi nộp bài
    if (result && mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }
  }, [isStarted, mediaStream, result]);

  // Format thời gian mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (result) {
    const scoreNum = Number(result.score);
    const isPassed = scoreNum >= 5;
    const formatElapsed = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return m > 0 ? `${m} phút ${sec} giây` : `${sec} giây`;
    };
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          {/* Kết quả chính */}
          <div className={`card p-10 text-center mb-8 border-t-4 ${isPassed ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`text-5xl mb-4 ${isPassed ? '' : ''}`}>{isPassed ? '🎉' : '📝'}</div>
            <h2 className={`font-display text-2xl font-bold mb-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'Xuất sắc! Bài thi hoàn thành' : 'Bài thi đã nộp'}
            </h2>
            <div className={`text-5xl font-extrabold my-4 ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
              {Number(result.score).toFixed(2).replace(/\.?0+$/, '')}/10
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
              <div className="bg-surface-hover rounded-xl p-3">
                <div className="text-ink-muted text-xs font-semibold uppercase mb-1">Câu đúng</div>
                <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
              </div>
              <div className="bg-surface-hover rounded-xl p-3">
                <div className="text-ink-muted text-xs font-semibold uppercase mb-1">Câu sai</div>
                <div className="text-2xl font-bold text-red-500">{result.totalQuestions - result.correctCount}</div>
              </div>
              <div className="bg-surface-hover rounded-xl p-3">
                <div className="text-ink-muted text-xs font-semibold uppercase mb-1">Tổng câu</div>
                <div className="text-2xl font-bold text-ink">{result.totalQuestions}</div>
              </div>
              <div className="bg-surface-hover rounded-xl p-3">
                <div className="text-ink-muted text-xs font-semibold uppercase mb-1">Thời gian</div>
                <div className="text-sm font-bold text-ink">{formatElapsed(elapsedSeconds)}</div>
              </div>
            </div>
            {submitTime && (
              <p className="text-xs text-ink-muted mt-4">
                📅 Nộp lúc: {submitTime.toLocaleString('vi-VN')}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-8">
              <Link
                href={`/exam/${quizId}/history`}
                className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-accent-hover transition-all"
              >
                Xem lại đáp án
              </Link>
              <button
                onClick={() => router.push('/my-courses')}
                className="bg-surface-hover text-ink border border-line px-8 py-3 rounded-full font-bold shadow-sm hover:bg-line transition-all"
              >
                Về khóa học
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold mb-4">Chi tiết bài làm (Socratic Tutor)</h3>
            {result.details?.map((detail, idx) => (
              <div key={detail.questionId} className={`card p-6 border-l-4 ${detail.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg">Câu {idx + 1}</h4>
                  {detail.isCorrect ? (
                    <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm">Đúng ✓</span>
                  ) : (
                    <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">Sai ✕</span>
                  )}
                </div>
                <p className="mb-4">{detail.content}</p>

                <div className="space-y-2 mb-6">
                  {detail.options.map(opt => {
                    const isSelected = detail.selectedOptionId === opt.id;
                    const isCorrect = detail.correctOptionId === opt.id;
                    let style = "p-3 border rounded-lg text-sm ";
                    if (isCorrect) style += "border-green-500 bg-green-50 text-green-900 font-medium";
                    else if (isSelected) style += "border-red-500 bg-red-50 text-red-900";
                    else style += "border-line text-ink-muted opacity-70";

                    return (
                      <div key={opt.id} className={style}>
                        {opt.content} {isSelected && !isCorrect && "(Bạn chọn)"} {isCorrect && "(Đáp án đúng)"}
                      </div>
                    );
                  })}
                </div>

                {!detail.isCorrect && (
                  <div className="mt-4 pt-4 border-t border-line">
                    {!explanations[detail.questionId] ? (
                      <button
                        onClick={() => handleExplain(detail.questionId, detail.selectedOptionId)}
                        className="text-accent text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        🤖 Hỏi Gia sư AI tại sao sai?
                      </button>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 font-bold text-blue-900 mb-2">
                          <span>🤖 Gia sư AI giải thích:</span>
                          {explanations[detail.questionId]?.loading && <span className="animate-pulse text-blue-500">Đang suy nghĩ...</span>}
                        </div>
                        {explanations[detail.questionId]?.text && (
                          <div className="text-sm text-blue-800 leading-relaxed">
                            <MarkdownRenderer content={explanations[detail.questionId]!.text!} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    const parseDate = (d: string | number[] | undefined) => {
      if (!d) return 0;
      if (Array.isArray(d)) {
        // Jackson LocalDateTime array: [year, month, day, hour, minute, second]
        return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0).getTime();
      }
      return new Date(d).getTime();
    };

    const sortedHistory = [...(history || [])].sort((a, b) => parseDate(a.submittedAt) - parseDate(b.submittedAt));
    const ongoingAttempt = history?.find(h => h.status === 'IN_PROGRESS');
    const completedAttempts = sortedHistory.filter(h => h.status === 'COMPLETED');
    const completedCount = completedAttempts.length;
    const highestAttempt = completedAttempts.length > 0 
      ? completedAttempts.reduce((prev, current) => {
          const prevScore = prev?.score || 0;
          const currentScore = current?.score || 0;
          return currentScore > prevScore ? current : prev;
        }, completedAttempts[0])
      : null;
    const isClosed = endTime ? new Date() > new Date(endTime) : false;
    const isNotOpenYet = startTime ? new Date() < new Date(startTime) : false;
    const maxAtt = parseInt(maxAttempts || '0');
    const canStartNewAttempt = !maxAttempts || maxAtt <= 0 || completedCount < maxAtt;

    return (
      <div className="min-h-dvh bg-surface p-4 sm:p-8">
        <div className="max-w-5xl mx-auto mt-4 sm:mt-8">
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button onClick={() => router.push('/my-courses')} className="text-accent hover:underline text-sm font-semibold whitespace-nowrap">Khóa học của tôi</button>
            {title.split(' / ').map((part, idx, arr) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-ink-muted">/</span>
                {idx < arr.length - 1 ? (
                  <button 
                    onClick={() => router.push(returnUrl || '/my-courses')} 
                    className="text-accent hover:underline text-sm font-semibold whitespace-nowrap"
                  >
                    {part}
                  </button>
                ) : (
                  <span className="text-ink text-sm font-medium">{part}</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="flex items-start gap-4 p-6 border-b border-line bg-surface-hover">
              <div className="w-14 h-14 rounded-md flex items-center justify-center font-bold text-2xl shadow-sm bg-accent text-white flex-shrink-0">
                📝
              </div>
              <div>
                <div className="text-xs text-ink-muted uppercase font-bold tracking-wider mb-1">Trắc Nghiệm {isProctored && '- Có giám sát Camera'}</div>
                <h3 className="font-display font-bold text-ink text-2xl">{title}</h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 text-sm text-ink space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-24 font-semibold text-ink-muted">Mở bài:</span>
                    <span className="font-medium text-ink">{startTime ? new Date(startTime).toLocaleString('vi-VN') : 'Không giới hạn'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-24 font-semibold text-ink-muted">Đóng bài:</span>
                    <span className="font-medium text-ink">{endTime ? new Date(endTime).toLocaleString('vi-VN') : 'Không giới hạn'}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-8">
                  <div className="flex items-center gap-3">
                    <span className="w-32 font-semibold text-ink-muted">Số câu:</span>
                    <span className="font-medium text-ink">{questionCount || '...'} câu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-32 font-semibold text-ink-muted">Thời gian:</span>
                    <span className="font-medium text-ink">{duration ? `${duration} phút` : 'Không giới hạn'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-32 font-semibold text-ink-muted">Số lượt làm:</span>
                    <span className="font-medium text-ink">{maxAttempts ? `${maxAttempts} lần` : 'Không giới hạn'}</span>
                  </div>
                </div>
              </div>

              {isProctored && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <p className="text-red-700 font-semibold text-sm flex items-center gap-2">
                    Để thực hiện bài trắc nghiệm này bạn cần bật Camera để AI giám sát. Không được chuyển tab hay rời khỏi màn hình.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            {highestAttempt && (
              <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-emerald-950 font-extrabold text-xl">Điểm chính thức của bạn</h3>
                  <p className="text-emerald-700 text-sm mt-1 font-medium">Hệ thống ghi nhận điểm cao nhất trong số các lần thi của bạn.</p>
                </div>
                <div className="text-left sm:text-right bg-white px-6 py-3 rounded-xl shadow-sm border border-emerald-100 min-w-[140px]">
                  <div className="text-3xl font-black text-emerald-600">{highestAttempt.correctCount} <span className="text-emerald-400 text-xl">/ {highestAttempt.totalQuestions}</span></div>
                  <div className="text-emerald-800 font-bold mt-1 text-sm">{Number(highestAttempt.score).toFixed(2).replace(/\.?0+$/, '')} điểm (Hệ 10)</div>
                </div>
              </div>
            )}

            <h3 className="text-xl font-bold text-ink mb-4">Tổng quan các lần làm bài trước của bạn</h3>
            <div className="overflow-hidden border border-line rounded-xl shadow-sm bg-surface">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-hover text-ink font-semibold border-b border-line">
                  <tr>
                    <th className="px-6 py-4">Lần thi</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Kết quả</th>
                    <th className="px-6 py-4 text-center">Xem lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sortedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-ink-muted">
                        Bạn chưa có lượt làm bài nào cho bài thi này.
                      </td>
                    </tr>
                  ) : (
                    sortedHistory.map((h, index) => {
                      if (h.status === 'IN_PROGRESS') return null;

                      const formatSubmittedAt = (d: string | number[]) => {
                        if (Array.isArray(d)) {
                          return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0).toLocaleString('vi-VN');
                        }
                        return new Date(d).toLocaleString('vi-VN');
                      };

                      return (
                        <tr key={h.id} className="hover:bg-surface-hover transition-colors">
                          <td className="px-6 py-4 font-bold text-ink">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-green-600">Đã xong</div>
                            <div className="text-ink-muted text-xs mt-1">Đã nộp {formatSubmittedAt(h.submittedAt)}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="font-bold text-lg text-ink">{h.correctCount} / {h.totalQuestions} <span className="text-sm font-normal text-ink-muted">câu</span></div>
                            <div className="text-xs font-semibold text-accent mt-1">{Number(h.score).toFixed(2).replace(/\.?0+$/, '')} điểm</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/exam/${quizId}/history`} className="text-accent font-semibold hover:underline">
                              Xem chi tiết
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center mt-8 space-y-4 pb-8">
            {ongoingAttempt ? (
              <button
                onClick={startExam}
                disabled={isStarting}
                className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
              >
                {isStarting ? 'Đang chuẩn bị...' : 'Tiếp tục làm bài'}
              </button>
            ) : isNotOpenYet ? (
              <div className="text-amber-600 font-bold p-4 bg-amber-50 rounded-lg">
                Bài thi chưa mở. Vui lòng quay lại sau.
              </div>
            ) : isClosed ? (
              <div className="text-red-500 font-bold p-4 bg-red-50 rounded-lg">
                Bài thi đã đóng. Bạn không thể làm bài nữa.
              </div>
            ) : !canStartNewAttempt ? (
              <div className="text-ink-muted font-semibold p-4 bg-surface-hover rounded-lg border border-line">
                Bạn đã hết số lần làm bài cho phép ({maxAttempts} lần).
              </div>
            ) : (
              <button
                onClick={startExam}
                disabled={(!isProctored ? false : !isModelLoaded) || isStarting}
                className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all disabled:opacity-50"
              >
                {isStarting ? 'Đang chuẩn bị...' : (!isProctored ? 'Bắt đầu làm bài mới' : isModelLoaded ? 'Bật Camera & Bắt đầu thi' : 'Đang tải AI Model...')}
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="text-ink-muted hover:text-ink font-semibold py-2 px-6 transition-colors"
            >
              Trở về khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface p-8">
      <div className="shell max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-line pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
              {isProctored ? <><span className="text-red-600">🔴</span> Phòng Thi Trực Tuyến (Có giám sát)</> : <>📄 Bài Thi Trắc Nghiệm</>}
            </h1>
            <p className="text-sm text-ink-muted mt-1">Mã đề thi: {quizId}</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Đồng hồ đếm ngược */}
            {isStarted && timeLeft !== null && (
              <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl border-2 ${timeLeft <= 60 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' :
                timeLeft <= 180 ? 'border-amber-400 text-amber-600 bg-amber-50' :
                  'border-line text-ink bg-surface-hover'
                }`}>
                <span>⏱</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            {isProctored && (
              <div className="text-right">
                <div className="text-sm font-semibold text-ink-muted">Cảnh báo vi phạm</div>
                <div className={`text-xl font-bold ${violationCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                  {violationCount} / 3
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 flex flex-col gap-6">
            {attemptData?.questions.map((q, idx) => (
              <div key={q.id} className="card p-6">
                <h3 className="font-bold text-lg mb-4">Câu hỏi {idx + 1}</h3>
                <p className="text-sm mb-6">{q.content}</p>

                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 border border-line rounded-lg hover:bg-surface-hover cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                        className="w-4 h-4 text-accent"
                      />
                      <span className="text-sm">{opt.content}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-1 flex flex-col gap-4 sticky top-8 self-start">
            {isProctored && (
              <div className="card overflow-hidden">
                <div className={`text-white text-xs font-bold p-2 text-center transition-colors ${faceStatus === 'DETECTING' ? 'bg-amber-500' :
                  faceStatus === 'FACE_FOUND' ? 'bg-green-600' : 'bg-red-600 animate-pulse'
                  }`}>
                  {faceStatus === 'DETECTING' && 'Đang quét khuôn mặt...'}
                  {faceStatus === 'FACE_FOUND' && 'Camera Giám Sát AI (Bình thường)'}
                  {faceStatus === 'NO_FACE' && 'CẢNH BÁO: KHÔNG THẤY KHUÔN MẶT'}
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover bg-black"
                />
              </div>
            )}

            <button
              onClick={submitExam}
              disabled={isSubmitting}
              className="bg-ink text-white font-bold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
