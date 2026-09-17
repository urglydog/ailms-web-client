'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useStartQuiz, useSubmitQuiz, useExplainWrongAnswer, useQuizHistory } from '@/hooks/useQuizzes';
import { StartRes, SubmitRes } from '@/lib/api/quizzes';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AntiCheatExamPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const userId = user?.id;
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
  const isTakingMode = searchParams.get('mode') === 'taking';

  const { data: history } = useQuizHistory(Number(quizId));

  const videoRef = useRef<HTMLVideoElement>(null);

  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSubmittedRef = useRef(false);

  const [isStarted, setIsStarted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (userId && quizId) {
      try {
        const saved = localStorage.getItem(`exam_violations_${userId}_${quizId}`);
        if (saved) setViolationCount(parseInt(saved, 10) || 0);
      } catch {}
    }
  }, [userId, quizId]);

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
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [result, setResult] = useState<SubmitRes | null>(null);
  const [submitTime, setSubmitTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startTimeRef = useRef<Date | null>(null);
  
  const [archivedError, setArchivedError] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [isHydrated, setIsHydrated] = useState(false);

  const [explanations, setExplanations] = useState<Record<number, { loading: boolean; text?: string }>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [resultPage, setResultPage] = useState(1);
  const questionsPerPage = 5;

  useEffect(() => {
    if (userId && quizId) {
      const draftKey = `exam_draft_${userId}_${quizId}`;
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            setAnswers(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse exam draft", e);
        localStorage.removeItem(draftKey);
      }
    }
    setIsHydrated(true);
  }, [userId, quizId]);

  useEffect(() => {
    if (isHydrated && userId && quizId && isStarted && !result) {
      const draftKey = `exam_draft_${userId}_${quizId}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers));
      } catch (e) {
        console.error("Failed to save exam draft", e);
      }
    }
  }, [answers, isHydrated, userId, quizId, isStarted, result]);

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
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models", err);
        // Fallback for demo
        setIsModelLoaded(true);
      }
    };
    loadModels();
  }, [isProctored]);

  // Tự động dọn dẹp LocalStorage rác khi load màn hình này nếu bài thi đã hoàn thành hoặc bị thu hồi
  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !quizId) return;
    const isDeleted = history?.some(h => h.isArchived);
    const hasCompleted = history?.some(h => h.status === 'COMPLETED');
    
    if (isDeleted || hasCompleted) {
      try {
        localStorage.removeItem(`exam_draft_${userId}_${quizId}`);
        localStorage.removeItem(`exam_violations_${userId}_${quizId}`);
        localStorage.removeItem(`quiz_draft_${userId}_${quizId}`);
        localStorage.removeItem(`quiz_draft_${quizId}`);
        // Xóa rác QuickCheck
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('quickcheck_state_') && key.endsWith(`_${quizId}`)) {
            localStorage.removeItem(key);
          }
        }
      } catch {}
    }
  }, [history, userId, quizId]);


  // Hàm nộp bài
  const submitExam = useCallback((_isAuto = false) => {
    if (!attemptData || isSubmitting || hasAutoSubmittedRef.current) return;
    if (_isAuto) hasAutoSubmittedRef.current = true;
    


    setIsSubmitting(true);
    // Dừng timer khi nộp bài
    if (timerRef.current) clearInterval(timerRef.current);
    // Tính thời gian làm bài thực tế
    const elapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000) : 0;
    setElapsedSeconds(elapsed);
    submitQuiz({ attemptId: attemptData.attemptId, data: { answers } }, {
      onSuccess: (data: SubmitRes) => {
        setResult(data);
        setSubmitTime(new Date());
        if (userId && quizId) {
          try {
            localStorage.removeItem(`exam_draft_${userId}_${quizId}`);
            localStorage.removeItem(`exam_violations_${userId}_${quizId}`);
            localStorage.removeItem(`quiz_draft_${userId}_${quizId}`);
            localStorage.removeItem(`quiz_draft_${quizId}`);
            // Xóa rác QuickCheck
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('quickcheck_state_') && key.endsWith(`_${quizId}`)) {
                localStorage.removeItem(key);
              }
            }
          } catch {}
        }
        // Dừng stream
        if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
        
        if (data && data.isArchived) {
          setArchivedError({ show: true, message: 'Bài nộp đã được lưu vào Bảng điểm. Bài thi này hiện đã được giảng viên lưu trữ.' });
        }
        router.replace(`/exam/${quizId}${returnUrl ? `?returnUrl=${returnUrl}` : ''}`);
      },
      onError: (err: unknown) => {
        const error = err as { response?: { status?: number, data?: { code?: string, message?: string } } };
        if (error.response?.status === 410 || error.response?.data?.code === 'QUIZ_ARCHIVED') {
          setArchivedError({ show: true, message: error.response?.data?.message || 'Bài tập này đã được giảng viên thu hồi.' });
          if (userId && quizId) {
            try {
              localStorage.removeItem(`exam_draft_${userId}_${quizId}`);
              localStorage.removeItem(`exam_violations_${userId}_${quizId}`);
            } catch {}
          }
          router.replace(`/exam/${quizId}${returnUrl ? `?returnUrl=${returnUrl}` : ''}`);
        } else if (error.response?.status === 404 || error.response?.status === 500) {
          setArchivedError({ show: true, message: 'Bài tập này đã được giảng viên gỡ bỏ hoặc cập nhật. Phiên làm bài kết thúc.' });
          router.replace(`/exam/${quizId}${returnUrl ? `?returnUrl=${returnUrl}` : ''}`);
        } else {
          toast.error('Có lỗi khi nộp bài. Vui lòng thử lại.');
        }
        setIsSubmitting(false);
      }
    });
  }, [attemptData, answers, isSubmitting, submitQuiz, mediaStream, userId, quizId, router, returnUrl]);

  // Anti-Cheat: Track tab switching
  useEffect(() => {
    if (!isStarted || isSubmitting || !!result || hasAutoSubmittedRef.current) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => {
          const newCount = prev + 1;
          const maxViolations = attemptData?.maxViolations || 3;
          if (userId && quizId) {
            try { localStorage.setItem(`exam_violations_${userId}_${quizId}`, newCount.toString()); } catch {}
          }
          if (newCount >= maxViolations) {
            toast.error(`Phát hiện gian lận chuyển Tab quá ${maxViolations} lần. Hệ thống tự động nộp bài!`);
            setTimeout(() => submitExam(true), 500);
          } else {
            toast.warning(`Cảnh báo gian lận (${newCount}/${maxViolations}): Bạn đã chuyển Tab. Hệ thống sẽ tự động nộp bài nếu vi phạm ${maxViolations} lần!`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStarted, isSubmitting, result, submitExam, attemptData?.maxViolations, userId, quizId]);


  // Hàm xử lý vi phạm với debounce (tránh trigger liên tục)
  const handleViolation = useCallback((reason: string) => {
    if (isSubmitting || result || hasAutoSubmittedRef.current) return;
    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return; // Debounce 2 giây
    lastViolationTime.current = now;

    setViolationCount((prev) => {
      const newCount = prev + 1;
      const maxViolations = attemptData?.maxViolations || 3;
      if (userId && quizId) {
        try { localStorage.setItem(`exam_violations_${userId}_${quizId}`, newCount.toString()); } catch {}
      }
      if (newCount >= maxViolations) {
        toast.error(`Bạn đã vi phạm quá ${maxViolations} lần. Hệ thống tự động nộp bài!`);
        submitExam(true);
      } else {
        toast.warning(`Cảnh báo vi phạm (${newCount}/${maxViolations}): ${reason}`);
      }
      return newCount;
    });
  }, [isSubmitting, result, submitExam, attemptData?.maxViolations, userId, quizId]);

  // 1. Chống chuyển tab
  useEffect(() => {
    if (!isStarted || result || !isProctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Chuyển tab hoặc thu nhỏ trình duyệt');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
          ).withFaceLandmarks();

          if (detections.length === 0) {
            setFaceStatus('NO_FACE');
            handleViolation('Không phát hiện thấy khuôn mặt trong Camera');
          } else if (detections.length > 1) {
            setFaceStatus('NO_FACE');
            handleViolation('Phát hiện có nhiều hơn 1 người trong khung hình');
          } else {
            const detection = detections[0];
            if (!detection) return;
            const landmarks = detection.landmarks;
            const noseTip = landmarks.getNose()[3];
            const leftJaw = landmarks.getJawOutline()[0];
            const rightJaw = landmarks.getJawOutline()[16];

            if (!noseTip || !leftJaw || !rightJaw) return;

            const leftDist = Math.abs(noseTip.x - leftJaw.x);
            const rightDist = Math.abs(noseTip.x - rightJaw.x);
            
            // Nếu tỷ lệ lệch quá lớn, chứng tỏ đang quay mặt hẳn sang 1 bên
            const ratio = leftDist / rightDist;
            if (ratio > 2.5 || ratio < 0.4) {
              setFaceStatus('NO_FACE');
              handleViolation('Phát hiện đầu quay sang một bên quá lâu (Nghi ngờ xem tài liệu)');
            } else {
              setFaceStatus('FACE_FOUND');
            }
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
  const startExam = useCallback(async () => {
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
        if (!isTakingMode) {
          if (isProctored) {
            toast.success('Bắt đầu làm bài. Vui lòng không chuyển tab!');
          } else {
            toast.success('Bắt đầu làm bài!');
          }
        }
        let url = `/exam/${quizId}?mode=taking`;
        if (proctoredParam) url += `&proctored=${proctoredParam}`;
        if (returnUrl) url += `&returnUrl=${returnUrl}`;
        router.push(url);
      },
      onError: (err: unknown) => {
        const error = err as { message?: string; response?: { data?: { message?: string; detail?: string }, status?: number } };
        if (error.response?.status === 404 || error.response?.status === 500) {
          toast.error('Bài tập này đã được giảng viên gỡ bỏ hoặc cập nhật.');
        } else {
          toast.error(error.message || error.response?.data?.message || error.response?.data?.detail || 'Không thể tải bài thi.');
        }
        if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      }
    });
  }, [isProctored, quizId, startQuiz, mediaStream, proctoredParam, returnUrl, router, isTakingMode]);

  // Cập nhật isStarted dựa trên mode=taking và attemptData
  useEffect(() => {
    if (isTakingMode && attemptData) {
      setIsStarted(true);
    } else {
      setIsStarted(false);
    }
  }, [isTakingMode, attemptData]);

  // B. Giữ Viewport Khi F5: Gọi startExam nếu có mode=taking nhưng mất attemptData
  useEffect(() => {
    if (isTakingMode && !attemptData && !isStarting && !result) {
      startExam();
    }
  }, [isTakingMode, attemptData, isStarting, result, startExam]);

  // Đồng hồ đếm ngược tuyệt đối dựa vào startedAt
  useEffect(() => {
    const examDurationMinutes = duration ? Number(duration) : attemptData?.durationMinutes;
    if (!isStarted || !examDurationMinutes || result || !attemptData?.startedAt) return;

    const startedAtTimestamp = Array.isArray(attemptData.startedAt)
      ? new Date(
          attemptData.startedAt[0],
          (attemptData.startedAt[1] || 1) - 1,
          attemptData.startedAt[2] || 1,
          attemptData.startedAt[3] || 0,
          attemptData.startedAt[4] || 0,
          attemptData.startedAt[5] || 0
        ).getTime()
      : new Date(attemptData.startedAt).getTime();
    
    startTimeRef.current = new Date(startedAtTimestamp);
    const totalDurationSeconds = examDurationMinutes * 60;

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAtTimestamp) / 1000);
      const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

      if (remainingSeconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(0);
        toast.warning('⏱ Hết giờ! Bài thi đã được tự động nộp.');
        setTimeout(() => submitExam(true), 300);
      } else {
        setTimeLeft(remainingSeconds);
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
          <div className={`card p-6 text-center mb-8 border-t-4 ${isPassed ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`text-4xl mb-2 ${isPassed ? '' : ''}`}>{isPassed ? '🎉' : '📝'}</div>
            <h2 className={`text-xl font-bold mb-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'Xuất sắc! Bài thi hoàn thành' : 'Bài thi đã nộp'}
            </h2>
            <div className={`text-3xl font-extrabold my-2 ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
              {Number(result.score).toFixed(2).replace(/\.?0+$/, '')}/10
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
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
            <div className="flex justify-center gap-4 mt-8 flex-wrap">
              <button
                onClick={() => {
                  if (returnUrl) {
                    router.push(returnUrl);
                  } else {
                    router.push('/my-courses');
                  }
                }}
                className="bg-accent text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-lg hover:bg-accent-hover transition-all"
              >
                Quay lại khóa học
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setIsStarted(false);
                  setAttemptData(null);
                  router.replace(`/exam/${quizId}${returnUrl ? `?returnUrl=${returnUrl}` : ''}`);
                }}
                className="bg-surface-hover text-ink px-6 py-2 rounded-lg font-semibold text-sm shadow-sm border border-line hover:bg-line transition-all"
              >
                Trở về lịch sử bài thi
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-2">Chi tiết bài làm (Socratic Tutor)</h3>
            {(() => {
              const resPerPage = 5;
              const totalResPages = Math.ceil((result.details?.length || 0) / resPerPage);
              const rStart = (resultPage - 1) * resPerPage;
              const rEnd = resultPage * resPerPage;
              return (
                <>
                {result.details?.slice(rStart, rEnd).map((detail, idx) => (
              <div key={detail.questionId} className={`card p-4 border-l-4 ${detail.isCorrect === null ? 'border-line bg-surface' : (detail.isCorrect ? 'border-green-500' : 'border-red-500')}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm">Câu {rStart + idx + 1}</h4>
                  {detail.isCorrect === true ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Đúng ✓</span>
                  ) : detail.isCorrect === false ? (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-xs">Sai ✕</span>
                  ) : (
                    <span className="text-ink-muted font-bold bg-surface-hover px-2 py-0.5 rounded border border-line text-xs">{detail.selectedOptionIds?.length ? 'Đã ghi nhận' : 'Bỏ trống'}</span>
                  )}
                </div>
                <p className="mb-3 text-sm">{detail.content}</p>

                <div className="space-y-1.5 mb-4">
                  {detail.options.map(opt => {
                    const isSelected = detail.selectedOptionIds?.includes(opt.id);
                    const isCorrect = detail.isCorrect !== null && detail.correctOptionIds?.includes(opt.id);
                    let style = "p-3 border rounded-lg text-sm ";
                    if (isCorrect) style += "border-green-500 bg-green-50 text-green-900 font-medium";
                    else if (isSelected) style += detail.isCorrect === null ? "border-accent bg-accent/5 text-accent-dark font-medium" : "border-red-500 bg-red-50 text-red-900";
                    else style += "border-line text-ink-muted opacity-70";

                    return (
                      <div key={opt.id} className={style}>
                        {opt.content} {isSelected && !isCorrect && "(Bạn chọn)"} {isCorrect && "(Đáp án đúng)"}
                      </div>
                    );
                  })}
                </div>

                {detail.isCorrect === false && (
                  <div className="mt-4 pt-4 border-t border-line">
                    {!explanations[detail.questionId] ? (
                      <button
                        onClick={() => handleExplain(detail.questionId, detail.selectedOptionIds?.[0] || null)}
                        className="text-accent text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        Hỏi Gia sư AI tại sao sai?
                      </button>
                    ) : (
                      <div className="bg-accent/5 p-4 rounded-lg border border-accent/15">
                        <div className="flex items-center gap-2 font-bold text-accent-dark mb-2">
                          <span>Gia sư AI giải thích:</span>
                          {explanations[detail.questionId]?.loading && <span className="animate-pulse text-accent">Đang suy nghĩ...</span>}
                        </div>
                        {explanations[detail.questionId]?.text && (
                          <div className="text-sm text-ink leading-relaxed">
                            <MarkdownRenderer content={explanations[detail.questionId]!.text!} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
                {totalResPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button disabled={resultPage === 1} onClick={() => setResultPage(p => p - 1)} className="px-4 py-1.5 border border-line rounded-lg text-sm font-semibold disabled:opacity-50">Trang trước</button>
                    <span className="text-sm font-medium text-ink-muted">Trang {resultPage}/{totalResPages}</span>
                    <button disabled={resultPage === totalResPages} onClick={() => setResultPage(p => p + 1)} className="px-4 py-1.5 border border-line rounded-lg text-sm font-semibold disabled:opacity-50">Trang sau</button>
                  </div>
                )}
                </>
              );
            })()}
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
    const isArchivedQuiz = history?.some(h => h.isArchived) || false;

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
                            {h.allowReview === false ? (
                              <span className="text-ink-muted text-sm font-semibold opacity-60 cursor-not-allowed" title="Bài thi không cho phép xem lại đáp án">Chỉ xem điểm</span>
                            ) : (
                              <Link href={`/exam/${quizId}/history?attemptId=${h.id}`} className="text-accent font-semibold hover:underline">
                                Xem chi tiết
                              </Link>
                            )}
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
            ) : isArchivedQuiz ? (
              <div className="text-red-500 font-bold p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm text-center">
                Bài thi này đã bị giảng viên thu hồi hoặc xóa.<br/>
                <span className="text-sm font-normal">Bạn chỉ có thể xem lại lịch sử làm bài.</span>
              </div>
            ) : !canStartNewAttempt ? (
              <button
                disabled
                className="bg-gray-300 text-gray-500 font-bold py-3 px-8 rounded-full cursor-not-allowed shadow-none"
              >
                Đã hết số lượt làm bài ({completedCount}/{maxAtt})
              </button>
            ) : (
              <button
                onClick={startExam}
                disabled={(!isProctored ? false : !isModelLoaded) || isStarting}
                className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all disabled:opacity-50"
              >
                {isStarting ? 'Đang chuẩn bị...' : (!isProctored ? 'Bắt đầu làm bài mới' : isModelLoaded ? 'Bật Camera & Bắt đầu thi' : 'Đang tải AI Model...')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  const handleFirstSubmitClick = () => {
    if (!attemptData) return;
    const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] && (answers[Number(k)]?.length || 0) > 0).length;
    if (answeredCount < attemptData.questions.length) {
      toast.warning('Vui lòng hoàn thành toàn bộ câu hỏi trước khi nộp');
    }
    setShowReviewConfirm(true);
  };

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
            {isProctored && (
              <div className="text-right">
                <div className="text-sm font-semibold text-ink-muted">Cảnh báo vi phạm</div>
                <div className={`text-xl font-bold ${violationCount >= (attemptData?.maxViolations || 3) - 1 ? 'text-red-600' : 'text-amber-600'}`}>
                  {violationCount} / {attemptData?.maxViolations || 3}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showReviewConfirm ? (() => {
          const reviewPerPage = 10;
          const totalQ = attemptData?.questions.length || 0;
          const totalReviewPages = Math.ceil(totalQ / reviewPerPage);
          const reviewStart = (currentPage - 1) * reviewPerPage;
          const reviewEnd = currentPage * reviewPerPage;
          const answeredTotal = attemptData?.questions.filter(q => answers[q.id] && (answers[q.id]?.length || 0) > 0).length || 0;
          return (
          <div className="card p-5 max-w-2xl mx-auto w-full">
            <h2 className="text-base font-bold mb-1 text-center">Xác nhận nộp bài</h2>
            <p className="text-xs text-ink-muted text-center mb-3">Đã trả lời: <strong className={answeredTotal < totalQ ? 'text-red-600' : 'text-green-600'}>{answeredTotal}/{totalQ}</strong> câu</p>
            <div className="space-y-1.5 mb-4">
              {attemptData?.questions.slice(reviewStart, reviewEnd).map((q, idx) => {
                const isAnswered = answers[q.id] && (answers[q.id]?.length || 0) > 0;
                return (
                  <div key={q.id} className={`py-2 px-3 border rounded flex items-center justify-between text-xs ${isAnswered ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="font-bold">Câu {reviewStart + idx + 1}</span>
                    <span className="font-semibold">{isAnswered ? '✅ Đã trả lời' : '❌ Chưa trả lời'}</span>
                  </div>
                );
              })}
            </div>
            {totalReviewPages > 1 && (
              <div className="flex justify-between items-center mb-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-line rounded text-xs font-semibold disabled:opacity-50">Trước</button>
                <span className="text-xs text-ink-muted">Trang {currentPage}/{totalReviewPages}</span>
                <button disabled={currentPage === totalReviewPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-line rounded text-xs font-semibold disabled:opacity-50">Sau</button>
              </div>
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-line">
              <button onClick={() => submitExam(false)} disabled={isSubmitting} className="w-full bg-accent text-white font-bold py-2.5 rounded-full hover:bg-accent-hover transition-colors shadow-lg text-sm">
                {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
              </button>
              <button onClick={() => setShowReviewConfirm(false)} className="w-full text-ink-muted font-semibold hover:text-ink text-xs py-1">
                Quay lại bài thi
              </button>
            </div>
          </div>
          );
        })() : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    
          <div className="col-span-2 flex flex-col gap-6">
            {attemptData?.questions
              .slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage)
              .map((q, idx) => (
              <div key={q.id} id={`question-${q.id}`} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">Câu hỏi {(currentPage - 1) * questionsPerPage + idx + 1}</h3>
                  <button 
                    onClick={() => setFlagged(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className={`text-xl ${flagged[q.id] ? 'text-red-500' : 'text-line-soft hover:text-red-200'}`}
                    title="Đánh dấu xem lại"
                  >
                    🚩
                  </button>
                </div>
                <p className="text-sm mb-6">{q.content}</p>

                {q.isMultipleChoice && <div className="text-sm text-ink-muted italic mb-4">(Chọn nhiều đáp án)</div>}
                <div className="space-y-3">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id]?.includes(opt.id);
                    return (
                    <label key={opt.id} className="flex items-center gap-3 p-3 border border-line rounded-lg hover:bg-surface-hover cursor-pointer">
                      <input
                        type={q.isMultipleChoice ? "checkbox" : "radio"}
                        name={`question_${q.id}`}
                        value={opt.id}
                        checked={isSelected || false}
                        onChange={() => {
                          if (q.isMultipleChoice) {
                            setAnswers(prev => {
                              const curr = prev[q.id] || [];
                              if (curr.includes(opt.id)) return { ...prev, [q.id]: curr.filter(id => id !== opt.id) };
                              return { ...prev, [q.id]: [...curr, opt.id] };
                            });
                          } else {
                            setAnswers(prev => ({ ...prev, [q.id]: [opt.id] }));
                          }
                        }}
                        className="w-4 h-4 text-accent"
                      />
                      <span className="text-sm">{opt.content}</span>
                    </label>
                  )})}
                </div>
              </div>
            ))}
            
            {attemptData?.questions && attemptData.questions.length > questionsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-4 py-2 border border-line rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Trang trước
                </button>
                <span className="text-sm font-medium text-ink-muted">
                  Trang {currentPage} / {Math.ceil(attemptData.questions.length / questionsPerPage)}
                </span>
                <button
                  disabled={currentPage === Math.ceil(attemptData.questions.length / questionsPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-4 py-2 border border-line rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>

          <div className="col-span-1">
            <div className="sticky top-24 w-full flex flex-col gap-3" style={{ maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}>
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

            {/* Đồng hồ đếm ngược */}
            {isStarted && timeLeft !== null && (
              <div className={`flex items-center justify-center gap-2 font-mono text-2xl font-bold px-4 py-3 rounded-xl border-2 shadow-sm ${timeLeft <= 60 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' :
                timeLeft <= 180 ? 'border-amber-400 text-amber-600 bg-amber-50' :
                  'border-line text-ink bg-surface'
                }`}>
                <span>⏱</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={() => handleFirstSubmitClick()}
              disabled={isSubmitting}
              className="bg-ink text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg w-full"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
            </button>

            <div className="card p-3">
              <div className="grid grid-cols-5 gap-2">
                {attemptData?.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] && (answers[q.id]?.length || 0) > 0;
                  const isFlagged = flagged[q.id];
                  const pageOfQuestion = Math.ceil((idx + 1) / questionsPerPage);
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentPage(pageOfQuestion);
                        setTimeout(() => document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                      }}
                      className={`flex flex-col h-9 w-full rounded overflow-hidden text-[10px] font-bold border transition-colors relative ${currentPage === pageOfQuestion && !isAnswered ? 'ring-2 ring-accent/50' : 'border-line'} hover:opacity-80`}
                    >
                      <div className="h-[70%] w-full flex items-center justify-center bg-surface text-ink border-b border-line/50">
                        {idx + 1}
                      </div>
                      <div className={`h-[30%] w-full flex items-center justify-center text-white text-[8px] ${isAnswered ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isAnswered ? '✓' : '✗'}
                      </div>
                      {isFlagged && <span className="absolute -top-1 -right-1 text-[10px] z-10">🚩</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {archivedError.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Bài thi không còn khả dụng</h3>
              <p className="text-ink-muted">{archivedError.message}</p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => router.push(returnUrl ? returnUrl : '/my-courses')}
                  className="bg-accent text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:bg-accent-hover transition-colors"
                >
                  Quay lại khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
