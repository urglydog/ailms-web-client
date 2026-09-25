'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import { useProctoredAttemptDetail } from '@/hooks/useProctoring';
import { ArrowLeftIcon } from '@/components/instructor/SidebarIcons';

const parseDate = (d: string | number[]) => {
  if (Array.isArray(d)) {
    return new Date(d[0] || 0, (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0);
  }
  return new Date(d);
};

const VIOLATION_LABEL: Record<string, string> = {
  TAB_SWITCH: 'Chuyển tab',
  WINDOW_BLUR: 'Chuyển cửa sổ/ứng dụng',
  FULLSCREEN_EXIT: 'Thoát toàn màn hình',
  NO_FACE: 'Không thấy khuôn mặt',
  MULTIPLE_FACES: 'Nhiều hơn 1 người',
  HEAD_TURNED: 'Quay đầu sang 1 bên',
  GAZE_AWAY: 'Ánh mắt rời màn hình (AI)',
  AUDIO_VOICE_DETECTED: 'Phát hiện giọng nói',
  DEVTOOLS_OPEN: 'Mở DevTools',
  COPY_PASTE_BLOCKED: 'Copy/paste/chuột phải',
  IDLE_TOO_LONG: 'Không tương tác quá lâu',
};

const RISK_STYLE: Record<string, string> = {
  LOW: 'text-success border-success/30 bg-success/5',
  MEDIUM: 'text-amber-600 border-amber-300 bg-amber-50',
  HIGH: 'text-danger border-danger/30 bg-danger/5',
};

const formatOffset = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** UC-ANTICHEAT (26/09/2026, kế thừa UX Gia sư AI) — chi tiết 1 lượt thi: video bằng chứng bên
 * trái luôn hiển thị (sticky, không mất khi cuộn danh sách dài), danh sách vi phạm bên phải kèm
 * mốc thời gian — click 1 dòng vừa TUA video tới đúng thời điểm vừa XỔ RA phân tích chi tiết của
 * AI cho đúng vi phạm đó (nếu có, vd Gemini Vision giải thích vì sao gắn cờ "ánh mắt rời màn
 * hình"), giống hệt cách trích dẫn `[MM:SS]` của Gia sư AI tua video bài giảng. */
export default function ProctoringAttemptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = Number(params.attemptId);
  const { data: attempt, isLoading } = useProctoredAttemptDetail(attemptId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleViolationClick = (idx: number, offsetSec: number) => {
    seekTo(offsetSec);
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  if (isLoading || !attempt) {
    return <div className="card p-8 text-center text-sm text-ink-muted">Đang tải...</div>;
  }

  return (
    <>
      <button
        onClick={() => router.back()}
        title="Quay lại"
        className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline mb-4"
      >
        <ArrowLeftIcon /> Quay lại
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{attempt.studentName}</h1>
          <p className="text-sm text-ink-muted">{attempt.studentEmail} · {parseDate(attempt.submittedAt).toLocaleString('vi-VN')}</p>
        </div>
        {attempt.aiRiskLevel && (
          <span className={`badge border text-sm inline-flex items-center gap-1 ${RISK_STYLE[attempt.aiRiskLevel] || ''}`}>
            <ShieldAlert className="w-3.5 h-3.5" /> {attempt.aiRiskLevel}
          </span>
        )}
      </div>

      {attempt.aiRiskExplanation && (
        <div className="card p-4 mb-6 border-l-4 border-l-accent">
          <div className="text-xs font-semibold uppercase text-ink-muted mb-1">Nhận định của AI</div>
          <p className="text-sm text-ink leading-relaxed m-0">{attempt.aiRiskExplanation}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Video luôn hiển thị, dính lại khi cuộn danh sách vi phạm dài bên phải — giống Gia sư
            AI luôn giữ player trên màn hình trong lúc đọc/trích dẫn transcript. */}
        <div className="lg:col-span-2 lg:sticky lg:top-4">
          <div className="card overflow-hidden">
            {attempt.videoUrl ? (
              <video ref={videoRef} src={attempt.videoUrl} controls className="w-full aspect-video bg-black" />
            ) : (
              <div className="aspect-video flex items-center justify-center text-sm text-ink-faint bg-surface-raised">
                Chưa có video
              </div>
            )}
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-2 max-h-[calc(100vh-160px)] overflow-y-auto">
          <div className="text-xs font-semibold uppercase text-ink-muted mb-1">
            Vi phạm ({attempt.violationCount})
          </div>
          {attempt.violations.length === 0 ? (
            <p className="text-sm text-ink-faint">Không có vi phạm.</p>
          ) : (
            attempt.violations.map((v, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div key={idx} className="rounded-lg border border-line overflow-hidden">
                  <button
                    onClick={() => handleViolationClick(idx, v.offsetSec)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-surface-raised transition-colors"
                  >
                    <span className="font-medium text-ink">{VIOLATION_LABEL[v.type] || v.type}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {attempt.videoUrl && <span className="text-accent font-mono">{formatOffset(v.offsetSec)}</span>}
                      {v.detail && <ChevronDown className={`w-3.5 h-3.5 text-ink-faint transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                    </span>
                  </button>
                  {isExpanded && v.detail && (
                    <div className="px-3 py-2 text-xs text-ink-muted leading-relaxed bg-surface-raised border-t border-line">
                      {v.detail}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
