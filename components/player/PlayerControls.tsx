'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Thanh điều khiển video tuỳ biến — giao diện tham khảo Udemy (06/09/2026).
 *
 * Thay thế HOÀN TOÀN UI mặc định của cả 2 nguồn video (`controls` gốc của thẻ `<video>` cho
 * UPLOAD, `playerVars.controls: 0` cho YouTube — xem `useDualPlayerSync.ts`) để giao diện đồng
 * nhất bất kể nguồn phát. Component THUẦN TRÌNH BÀY — không tự biết đang phát nguồn nào, toàn bộ
 * logic điều khiển thật (play/pause/seek/tốc độ/âm lượng/chất lượng) do `DualPlayer.tsx` cung cấp
 * qua props, tách biệt để không phải viết 2 lần cho UPLOAD và YOUTUBE.
 *
 * `qualities = null` ẩn hẳn mục "Chất lượng video" trong Cài đặt — dùng cho nguồn UPLOAD, nơi hệ
 * thống chỉ lưu đúng 1 file/bài học (không có pipeline chuyển mã nhiều độ phân giải), khác nguồn
 * YouTube có thể dùng thẳng cơ chế chọn chất lượng có sẵn của IFrame Player API.
 */

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const QUALITY_LABELS: Record<string, string> = {
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'Tự động',
};

export interface PlayerControlsProps {
  isPlaying: boolean;
  currentSec: number;
  duration: number;
  playbackRate: number;
  /** 0-100, luôn phản ánh đúng nguồn ĐANG PHÁT ÂM THANH THẬT (xem giải thích ở `DualPlayer.tsx`). */
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  /** null = ẩn mục Chất lượng (xem docblock đầu file). */
  qualities: string[] | null;
  quality: string | null;
  onSetQuality: (q: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  autoNextEnabled: boolean;
  onToggleAutoNext: () => void;
  onOpenShortcuts: () => void;
  onOpenSubtitleSettings: () => void;
}

function formatTime(rawSec: number): string {
  const totalSec = Number.isFinite(rawSec) && rawSec > 0 ? Math.floor(rawSec) : 0;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

/** Đóng popover khi click ra ngoài hoặc nhấn Esc — cùng khuôn với `LanguageDropdown.tsx`. */
function useClosePopover(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, ref]);
}

export function PlayerControls({
  isPlaying,
  currentSec,
  duration,
  playbackRate,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onSetPlaybackRate,
  onSetVolume,
  onToggleMute,
  qualities,
  quality,
  onSetQuality,
  isFullscreen,
  onToggleFullscreen,
  showTranscript,
  onToggleTranscript,
  autoNextEnabled,
  onToggleAutoNext,
  onOpenShortcuts,
  onOpenSubtitleSettings,
}: PlayerControlsProps) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubPreviewSec, setScrubPreviewSec] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useClosePopover(speedOpen, () => setSpeedOpen(false), speedRef);
  useClosePopover(settingsOpen, () => setSettingsOpen(false), settingsRef);

  const displaySec = scrubbing ? scrubPreviewSec : currentSec;
  const progressPercent = duration > 0 ? Math.min(100, (displaySec / duration) * 100) : 0;

  const seekFromClientX = (clientX: number): number => {
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return 0;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return fraction * duration;
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    setScrubPreviewSec(seekFromClientX(e.clientX));
  };
  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return;
    setScrubPreviewSec(seekFromClientX(e.clientX));
  };
  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return;
    setScrubbing(false);
    onSeek(seekFromClientX(e.clientX));
  };

  const qualityOptions = (qualities ?? []).filter((q) => q !== 'unknown');

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 select-none bg-gradient-to-t from-black/85 via-black/45 to-transparent pb-1.5 pt-6 text-white">
      {/* Thanh tua — kéo/click tới bất kỳ vị trí nào, không chỉ tua từng 5 giây */}
      <div
        ref={progressBarRef}
        onPointerDown={handleProgressPointerDown}
        onPointerMove={handleProgressPointerMove}
        onPointerUp={handleProgressPointerUp}
        className="group relative mx-3 mb-1.5 h-3 cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
        </div>
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-0 shadow transition-opacity group-hover:opacity-100"
          style={{ left: `${progressPercent}%` }}
          aria-hidden
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3">
        {/* ── Cụm trái: play/pause · lùi 5s · tốc độ · tua 5s · thời lượng ── */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onTogglePlay} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'} className="hover:text-accent-glow">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentSec - 5))}
            aria-label="Lùi 5 giây"
            title="Lùi 5 giây"
            className="hover:text-accent-glow"
          >
            <Skip5Icon direction="back" />
          </button>

          <div ref={speedRef} className="relative">
            <button
              type="button"
              onClick={() => setSpeedOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={speedOpen}
              className="rounded border border-white/30 px-1.5 py-0.5 text-[12px] font-semibold hover:border-white"
            >
              {playbackRate}x
            </button>
            {speedOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-2 w-20 overflow-hidden rounded-md border border-white/10 bg-ink text-[13px] shadow-card-hover">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSetPlaybackRate(s);
                      setSpeedOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${
                      s === playbackRate ? 'font-semibold text-accent-glow' : 'text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSeek(Math.min(duration, currentSec + 5))}
            aria-label="Tua tới 5 giây"
            title="Tua tới 5 giây"
            className="hover:text-accent-glow"
          >
            <Skip5Icon direction="forward" />
          </button>

          <span className="font-mono text-[12px] text-white/85">
            {formatTime(displaySec)} / {formatTime(duration)}
          </span>
        </div>

        {/* ── Cụm phải: âm lượng · transcript · cài đặt · toàn màn hình ── */}
        <div className="flex items-center gap-3">
          {/* Mặc định CHỈ hiện icon loa — giữ chuột/focus vào loa mới lộ thanh kéo âm lượng.
              Bọc `<input>` trong 1 div `overflow-hidden` riêng (thay vì tự co width chính nó)
              vì con trượt (thumb) của `<input type="range">` không bị cắt theo width của
              chính nó khi width=0 — vẫn còn 1 chấm màu tràn ra ngoài dù thanh trông như đã ẩn. */}
          <div className="group flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted || volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'}
              className="hover:text-accent-glow"
            >
              {muted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <div className="w-0 overflow-hidden transition-[width] duration-150 group-hover:w-16 group-focus-within:w-16">
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => onSetVolume(Number(e.target.value))}
                aria-label="Âm lượng"
                className="h-1 w-16 accent-accent"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTranscript}
            aria-pressed={showTranscript}
            title="Bản ghi lời thoại (Transcript)"
            className={showTranscript ? 'text-accent-glow' : 'hover:text-accent-glow'}
          >
            <TranscriptIcon />
          </button>

          <div ref={settingsRef} className="relative">
            <button type="button" onClick={() => setSettingsOpen((v) => !v)} aria-label="Cài đặt" title="Cài đặt" className="hover:text-accent-glow">
              <GearIcon />
            </button>
            {settingsOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-64 overflow-hidden rounded-md border border-white/10 bg-ink text-[13px] shadow-card-hover">
                {qualityOptions.length > 0 && (
                  <div className="border-b border-white/10 p-2">
                    <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                      Chất lượng video
                    </p>
                    {qualityOptions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onSetQuality(q)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-white/10 ${
                          q === quality ? 'text-accent-glow' : 'text-white'
                        }`}
                      >
                        {QUALITY_LABELS[q] ?? q}
                        {q === quality && <span aria-hidden>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 p-3">
                  <span>Tự động phát bài tiếp theo</span>
                  <input type="checkbox" checked={autoNextEnabled} onChange={onToggleAutoNext} className="h-4 w-4 rounded accent-accent" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSubtitleSettings();
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-b border-white/10 p-3 text-left hover:bg-white/10"
                >
                  <span aria-hidden>🔤</span>
                  Cài đặt phụ đề
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 p-3 text-left hover:bg-white/10"
                >
                  <span aria-hidden>⌨️</span>
                  Phím tắt bàn phím
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            className="hover:text-accent-glow"
          >
            {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Icon SVG nhỏ gọn — stroke 1.8-2.2 để đồng bộ độ đậm nét ──

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

/** Mũi tên xoay tròn kèm số "5" chồng ở giữa — mẫu icon "tua/lùi 5 giây" quen thuộc. */
function Skip5Icon({ direction }: { direction: 'back' | 'forward' }) {
  const arrowPath = direction === 'back' ? 'M4 12a8 8 0 1 0 2.34-5.66' : 'M20 12a8 8 0 1 1-2.34-5.66';
  const tickPath = direction === 'back' ? 'M3 5v4h4' : 'M21 5v4h-4';
  return (
    <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0"
      >
        <path d={arrowPath} />
        <path d={tickPath} />
      </svg>
      <span className="relative text-[8px] font-bold leading-none">5</span>
    </span>
  );
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </svg>
  );
}

function TranscriptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M9 10h6M9 13h6M9 16h4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M8 21H4a1 1 0 0 1-1-1v-4" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v4a1 1 0 0 1-1 1H4M20 8h-4a1 1 0 0 1-1-1V3M15 21v-4a1 1 0 0 1 1-1h4M4 16h4a1 1 0 0 1 1 1v4" />
    </svg>
  );
}
