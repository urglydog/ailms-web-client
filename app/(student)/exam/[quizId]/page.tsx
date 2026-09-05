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
  const attemptCount = searchParams.get('attemptCount');
  const proctoredParam = searchParams.get('proctored');
  const isProctored = proctoredParam === 'true';

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

  // Đồng hồ đếm ngược: bắt đầu khi exam started và có duration
  useEffect(() => {
    const examDurationMinutes = duration ? Number(duration) : null;
    if (!isStarted || !examDurationMinutes || result) return;
    // Khởi tạo thời gian
    const totalSeconds = examDurationMinutes * 60;
    setTimeLeft(totalSeconds);
    startTimeRef.current = new Date();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Hết giờ → tự nộp bài
          clearInterval(timerRef.current!);
          toast.warning('⏱ Hết giờ! Bài thi đã được tự động nộp.');
          setTimeout(() => submitExam(), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, duration, result]);

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
              {result.score}/10
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
              <button 
                onClick={() => router.push('/my-courses')}
                className="bg-ink text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 transition-all"
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
              <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl border-2 ${
                timeLeft <= 60 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' :
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

        {!isStarted ? (
          <div className="max-w-5xl mx-auto mt-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="flex items-start gap-4 p-6 border-b border-gray-100">
                <div className="w-14 h-14 rounded-md flex items-center justify-center font-bold text-2xl shadow-sm bg-pink-500 text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Trắc Nghiệm {isProctored && '- Có giám sát Camera'}</div>
                  <h3 className="font-bold text-orange-600 text-2xl">{title}</h3>
                </div>
              </div>

              <div className="p-8 text-sm text-gray-800 space-y-8 bg-gray-50/30">
                <div className="space-y-1">
                  {startTime && <p><strong className="font-semibold text-gray-900 w-20 inline-block">Opened:</strong> {new Date(startTime).toLocaleString('en-GB')}</p>}
                  {endTime && <p><strong className="font-semibold text-gray-900 w-20 inline-block">Closed:</strong> {new Date(endTime).toLocaleString('en-GB')}</p>}
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <p>Bài thi gồm {questionCount || '...'} câu</p>
                  <p>Thời gian làm bài: {duration ? `${duration} phút` : 'Không giới hạn'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-sm text-gray-800">
              <p>Attempts allowed: {maxAttempts || 'Không giới hạn'}</p>
              {isProctored && <p className="text-red-600 font-semibold">Để thực hiện bài trắc nghiệm này bạn cần bật Camera để AI giám sát. Không được chuyển tab hay rời khỏi màn hình.</p>}
              <p>Thời gian làm bài: {duration ? `${duration} phút` : 'Không giới hạn'}</p>
            </div>

            {history && history.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl text-orange-600 mb-4">Tổng quan các lần làm bài trước của bạn</h3>
                <div className="overflow-hidden border border-gray-200 rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#8ebb83] text-white">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 font-semibold text-center w-32">Xem lại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">Đã xong</div>
                            <div className="text-gray-500 text-xs mt-1">Đã nộp {new Date(h.submittedAt).toLocaleString('en-GB')}</div>
                            <div className="text-blue-600 font-medium text-xs mt-1">Điểm: {h.score.toFixed(1)}/10</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Link href={`/exam/${quizId}/history`} className="text-blue-600 hover:underline">
                              Xem chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center mt-8 space-y-4 pb-8">
              {(!maxAttempts || attemptCount === null || parseInt(attemptCount) < parseInt(maxAttempts)) ? (
                <button
                  onClick={startExam}
                  disabled={(!isProctored ? false : !isModelLoaded) || isStarting}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded border shadow-sm transition-colors disabled:opacity-50"
                >
                  {isStarting ? 'Đang chuẩn bị...' : (!isProctored ? 'Bắt đầu làm bài' : isModelLoaded ? 'Bật Camera & Bắt đầu thi' : 'Đang tải AI Model...')}
                </button>
              ) : (
                <div className="text-gray-500 font-medium">
                  Không cho phép nhiều lần thử
                </div>
              )}
              <button
                onClick={() => router.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded border shadow-sm transition-colors"
              >
                Trở về khóa học
              </button>
            </div>
          </div>
        ) : (
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
                  <div className={`text-white text-xs font-bold p-2 text-center transition-colors ${
                    faceStatus === 'DETECTING' ? 'bg-amber-500' :
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
        )}
      </div>
    </div>
  );
}
