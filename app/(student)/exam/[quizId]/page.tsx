'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStartQuiz, useSubmitQuiz, useExplainWrongAnswer } from '@/hooks/useQuizzes';
import { StartRes, SubmitRes } from '@/lib/api/quizzes';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function AntiCheatExamPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isStarted, setIsStarted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Trạng thái AI
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'DETECTING' | 'FACE_FOUND' | 'NO_FACE'>('DETECTING');
  
  const lastViolationTime = useRef(0);
  const detectInterval = useRef<NodeJS.Timeout | null>(null);

  const { mutate: startQuiz, isPending: isStarting } = useStartQuiz();
  const { mutate: submitQuiz } = useSubmitQuiz();
  const { mutate: explainWrongAnswer } = useExplainWrongAnswer();
  const [attemptData, setAttemptData] = useState<StartRes | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitRes | null>(null);
  
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
  }, []);

  // Hàm nộp bài
  const submitExam = useCallback(() => {
    if (isSubmitting || !attemptData) return;
    setIsSubmitting(true);
    submitQuiz(
      { attemptId: attemptData.attemptId, data: { answers } },
      {
        onSuccess: (data) => {
          setResult(data);
          toast.success(`Đã nộp bài! Bạn đạt ${data.score} điểm.`);
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi nộp bài.');
          setIsSubmitting(false);
        }
      }
    );
  }, [isSubmitting, attemptData, answers, submitQuiz]);

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
    if (!isStarted || result) return;

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
  }, [isStarted, result, handleViolation]);

  // 2. Face API Detection Loop
  useEffect(() => {
    if (!isStarted || !videoRef.current || !isModelLoaded || result) return;

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
  }, [isStarted, isModelLoaded, result, handleViolation]);

  // Yêu cầu bật Camera
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);

      startQuiz(Number(quizId), {
        onSuccess: (data) => {
          setAttemptData(data);
          setIsStarted(true);
          toast.success('Bắt đầu làm bài. Vui lòng không chuyển tab!');
        },
        onError: (err: unknown) => {
          const error = err as { message?: string; response?: { data?: { message?: string; detail?: string } } };
          toast.error(error.message || error.response?.data?.message || error.response?.data?.detail || 'Không thể tải bài thi, có thể khóa học này chưa có Quiz chính thức.');
        }
      });
    } catch {
      toast.error('Bạn phải cấp quyền sử dụng Camera để làm bài thi này!');
    }
  };

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

  if (result) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 text-center mb-8">
            <h2 className="font-display text-2xl font-bold mb-4 text-green-600">Hoàn thành bài thi!</h2>
            <div className="text-4xl font-bold text-accent mb-6">{result.score}/10 Điểm</div>
            <p className="text-ink-muted mb-8">
              Bạn đã trả lời đúng {result.correctCount} trên tổng số {result.totalQuestions} câu hỏi.
            </p>
            <button 
              onClick={() => router.push('/progress')}
              className="bg-ink text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 transition-all"
            >
              Quay lại Tiến độ học tập
            </button>
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
              <span className="text-red-600">🔴</span> Phòng Thi Trực Tuyến
            </h1>
            <p className="text-sm text-ink-muted mt-1">Mã khóa học: {quizId}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-ink-muted">Cảnh báo vi phạm</div>
            <div className={`text-xl font-bold ${violationCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
              {violationCount} / 3
            </div>
          </div>
        </div>

        {!isStarted ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <h2 className="font-display text-xl font-bold mb-4">Nội quy phòng thi AI</h2>
            <ul className="text-left text-sm text-ink-muted mb-8 space-y-2 list-disc ml-4">
              <li>Yêu cầu bật Camera liên tục trong suốt quá trình thi.</li>
              <li>Hệ thống AI sẽ nhận diện khuôn mặt liên tục.</li>
              <li><strong className="text-red-600">Tuyệt đối không:</strong> Chuyển tab, rời chuột khỏi viền trình duyệt, hoặc quay mặt đi chỗ khác.</li>
              <li>Vi phạm quá 3 lần hệ thống sẽ tự động thu bài.</li>
            </ul>
            <button 
              onClick={startExam}
              disabled={!isModelLoaded || isStarting}
              className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-accent-dark hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isStarting ? 'Đang tải đề thi...' : isModelLoaded ? 'Bật Camera & Bắt đầu thi' : 'Đang tải AI Model...'}
            </button>
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
