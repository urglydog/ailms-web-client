'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AntiCheatExamPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [violationCount, setViolationCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Trạng thái AI
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'DETECTING' | 'FACE_FOUND' | 'NO_FACE'>('DETECTING');
  
  const lastViolationTime = useRef(0);
  const detectInterval = useRef<NodeJS.Timeout | null>(null);

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

  // Hàm xử lý vi phạm với debounce (tránh trigger liên tục)
  const handleViolation = useCallback((reason: string) => {
    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return; // Debounce 2 giây
    lastViolationTime.current = now;

    setViolationCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        toast.error('Bạn đã vi phạm quá 3 lần. Hệ thống tự động nộp bài!');
        setTimeout(() => router.push('/progress'), 2000);
      } else {
        toast.warning(`Cảnh báo vi phạm (${newCount}/3): ${reason}`);
      }
      return newCount;
    });
  }, [router]);

  // 1. Chống chuyển tab & Rời chuột khỏi màn hình
  useEffect(() => {
    if (!isStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Chuyển tab hoặc thu nhỏ trình duyệt');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Mất tiêu điểm cửa sổ thi');
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Chỉ tính vi phạm nếu chuột rời khỏi cửa sổ browser đi sang màn hình khác / mép màn hình
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
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
  }, [isStarted, handleViolation]);

  // 2. Face API Detection Loop
  useEffect(() => {
    if (!isStarted || !videoRef.current || !isModelLoaded) return;

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
        } catch (e) {
          // ignore detection error
        }
      }, 2000); // Quét mỗi 2s
    };

    video.addEventListener('play', startDetection);
    return () => {
      video.removeEventListener('play', startDetection);
      if (detectInterval.current) clearInterval(detectInterval.current);
    };
  }, [isStarted, isModelLoaded, handleViolation]);

  // Yêu cầu bật Camera
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      setIsCameraActive(true);
      setIsStarted(true);
      toast.success('Bắt đầu làm bài. Vui lòng không chuyển tab!');
    } catch (err) {
      toast.error('Bạn phải cấp quyền sử dụng Camera để làm bài thi này!');
    }
  };

  // Gắn stream
  useEffect(() => {
    if (isStarted && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isStarted, mediaStream]);

  return (
    <div className="min-h-dvh bg-surface p-8">
      <div className="shell max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-line pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-red-600">🔴</span> Phòng Thi Trực Tuyến
            </h1>
            <p className="text-sm text-ink-muted mt-1">Mã bài thi: {quizId}</p>
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
              disabled={!isModelLoaded}
              className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-accent-dark hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isModelLoaded ? 'Bật Camera & Bắt đầu thi' : 'Đang tải AI Model...'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 card p-6">
              <h3 className="font-bold text-lg mb-4">Câu hỏi 1</h3>
              <p className="text-sm mb-6">Trí tuệ nhân tạo (AI) là gì?</p>
              
              <div className="space-y-3">
                {['Khả năng máy tính mô phỏng trí tuệ con người', 'Một phần mềm nghe nhạc', 'Một loại phần cứng', 'Một ngôn ngữ lập trình'].map((ans, i) => (
                  <label key={i} className="flex items-center gap-3 p-3 border border-line rounded-lg hover:bg-surface-hover cursor-pointer">
                    <input type="radio" name="q1" className="w-4 h-4 text-accent" />
                    <span className="text-sm">{ans}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-1 flex flex-col gap-4">
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

              <button className="bg-ink text-white font-bold py-3 rounded-xl hover:bg-gray-800">
                Nộp bài sớm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
