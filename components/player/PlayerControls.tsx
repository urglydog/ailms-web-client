'use client';

import { useTranslations } from 'next-intl';
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
 *
 * BUG THẬT (11/09/2026): hover/bấm vào các nút (Cài đặt, Transcript, tốc độ đang chọn...) làm
 * CHỮ/ICON BIẾN MẤT — nguyên nhân là token `accent-glow` (tailwind.config.ts) đã đổi thành
 * `transparent` (bỏ hiệu ứng "glow" khi chuyển hướng thiết kế Enterprise/Academic) nhưng file này
 * vẫn dùng `accent-glow` làm màu hover/active. Đổi hẳn sang `accent` (xanh dương đặc, luôn thấy
 * rõ trên nền tối của thanh điều khiển) — không dùng lại `accent-glow` ở đây nữa.
 */

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Vùng bấm nút biểu tượng: 40px trên điện thoại (WCAG 2.5.8, khuyến nghị chạm), 32px khi có chuột. */
const CTRL = 'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150 sm:h-8 sm:w-8';

const QUALITY_LABELS: Record<string, string> = {
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
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
  /** Bật/tắt phụ đề — đưa RA THẲNG thanh điều khiển (11/09/2026, trước đây chôn trong Cài đặt
   * → Cài đặt phụ đề, học viên phản ánh khó bấm) — `*Available = false` disable nút khi bài học
   * chưa có phụ đề loại đó. */
  showOriginalSub: boolean;
  /** Gợi ý (tooltip) khi nút Gốc đang điều khiển nguồn phụ đề khác mặc định, vd phụ đề CC của YouTube. */
  originalSubtitleHint?: string;
  onToggleShowOriginalSub: () => void;
  originalSubtitleAvailable: boolean;
  showTranslatedSub: boolean;
  onToggleShowTranslatedSub: () => void;
  translatedSubtitleAvailable: boolean;
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

/** Đóng popover khi click ra ngoài hoặc nhấn Esc — cùng khuôn với `DubbingBar.tsx`. */
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
  showOriginalSub,
  originalSubtitleHint,
  onToggleShowOriginalSub,
  originalSubtitleAvailable,
  showTranslatedSub,
  onToggleShowTranslatedSub,
  translatedSubtitleAvailable,
  autoNextEnabled,
  onToggleAutoNext,
  onOpenShortcuts,
  onOpenSubtitleSettings,
}: PlayerControlsProps) {
  const t = useTranslations('learn.player.controls');
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
        className="group relative mx-3 mb-1.5 h-6 cursor-pointer touch-none sm:h-3"
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

      {/* (26/09/2026, sửa lỗi) — 11 nút điều khiển trên CÙNG 1 hàng không co giãn tràn hẳn ra
          khỏi màn hình điện thoại (~440px cần trong khi video chỉ còn ~320px sau padding trang).
          Thêm `flex-wrap` để cụm phải (phụ đề/transcript/cài đặt/toàn màn hình) tự rớt xuống
          hàng dưới khi không đủ chỗ, thay vì bị cắt/tràn — không ẩn bớt chức năng nào (phụ
          đề song ngữ là tính năng lõi của dự án, không nên giấu trên di động). */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-2 sm:px-3">
        {/* ── Cụm trái: play/pause · lùi 5s · tốc độ · tua 5s · thời lượng ── */}
        <div className="flex items-center gap-0.5 sm:gap-3">
          <button type="button" onClick={onTogglePlay} aria-label={isPlaying ? t('pause') : t('play')} className={`${CTRL} hover:text-accent`}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentSec - 5))}
            aria-label={t('back5')}
            title={t('back5')}
            className={`${CTRL} hover:text-accent`}
          >
            <Skip5Icon direction="back" />
          </button>

          <div ref={speedRef} className="relative">
            <button
              type="button"
              onClick={() => setSpeedOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={speedOpen}
              className="min-h-10 rounded border border-white/30 px-2 py-0.5 text-[12px] font-semibold transition-colors duration-150 hover:border-white sm:min-h-0 sm:px-1.5"
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
                      s === playbackRate ? 'font-semibold text-accent' : 'text-white'
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
            aria-label={t('forward5')}
            title={t('forward5')}
            className={`${CTRL} hover:text-accent`}
          >
            <Skip5Icon direction="forward" />
          </button>

          <span className="font-mono text-[12px] text-white/85">
            {formatTime(displaySec)} / {formatTime(duration)}
          </span>
        </div>

        {/* ── Cụm phải: âm lượng · phụ đề gốc/dịch · transcript · cài đặt · toàn màn hình ── */}
        <div className="flex items-center gap-0.5 sm:gap-2.5">
          {/* Mặc định CHỈ hiện icon loa — giữ chuột/focus vào loa mới lộ thanh kéo âm lượng.
              Bọc `<input>` trong 1 div `overflow-hidden` riêng (thay vì tự co width chính nó)
              vì con trượt (thumb) của `<input type="range">` không bị cắt theo width của
              chính nó khi width=0 — vẫn còn 1 chấm màu tràn ra ngoài dù thanh trông như đã ẩn. */}
          <div className="group flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted || volume === 0 ? t('unmute') : t('mute')}
              className={`${CTRL} hover:text-accent`}
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
                aria-label={t('volume')}
                className="h-1 w-16 accent-accent"
              />
            </div>
          </div>

          {/* Bật/tắt phụ đề — nhãn CHỮ (Gốc/Dịch) thay vì icon mơ hồ, giống nút "CC" quen thuộc
              của các trình phát video, dễ hiểu ngay không cần đoán icon. */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleShowOriginalSub}
              disabled={!originalSubtitleAvailable}
              aria-pressed={showOriginalSub}
              title={originalSubtitleAvailable ? (originalSubtitleHint ?? t('originalSub')) : t('noOriginalSub')}
              className={`min-h-10 rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors sm:min-h-0 sm:px-1.5 disabled:cursor-not-allowed disabled:opacity-30 ${
                showOriginalSub ? 'border-accent bg-accent text-white' : 'border-white/30 text-white/85 hover:border-white'
              }`}
            >
              {t('original')}
            </button>
            <button
              type="button"
              onClick={onToggleShowTranslatedSub}
              disabled={!translatedSubtitleAvailable}
              aria-pressed={showTranslatedSub}
              title={translatedSubtitleAvailable ? t('translatedSub') : t('noTranslatedSub')}
              className={`min-h-10 rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors sm:min-h-0 sm:px-1.5 disabled:cursor-not-allowed disabled:opacity-30 ${
                showTranslatedSub ? 'border-accent bg-accent text-white' : 'border-white/30 text-white/85 hover:border-white'
              }`}
            >
              {t('translated')}
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleTranscript}
            aria-pressed={showTranscript}
            title={t('transcript')}
            className={`${CTRL} ${showTranscript ? 'text-accent' : 'hover:text-accent'}`}
          >
            <TranscriptIcon />
          </button>

          <div ref={settingsRef} className="relative">
            <button type="button" onClick={() => setSettingsOpen((v) => !v)} aria-label={t('settings')} title={t('settings')} className={`${CTRL} hover:text-accent`}>
              <GearIcon />
            </button>
            {settingsOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-64 overflow-hidden rounded-md border border-white/10 bg-ink text-[13px] shadow-card-hover">
                {qualityOptions.length > 0 && (
                  <div className="border-b border-white/10 p-2">
                    <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                      {t('videoQuality')}
                    </p>
                    {qualityOptions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onSetQuality(q)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-white/10 ${
                          q === quality ? 'text-accent' : 'text-white'
                        }`}
                      >
                        {q === 'auto' ? t('auto') : (QUALITY_LABELS[q] ?? q)}
                        {q === quality && <span aria-hidden>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 p-3">
                  <span>{t('autoNext')}</span>
                  <input type="checkbox" checked={autoNextEnabled} onChange={onToggleAutoNext} className="h-4 w-4 rounded accent-accent" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSubtitleSettings();
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 border-b border-white/10 p-3 text-left hover:bg-white/10"
                >
                  <SubtitleStyleIcon />
                  {t('subtitleStyle')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 p-3 text-left hover:bg-white/10"
                >
                  <KeyboardIcon />
                  {t('shortcuts')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            className={`${CTRL} hover:text-accent`}
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

/** Ô chữ "Aa" trong khung — thay cho emoji 🔤, cùng quy ước với các nút chọn cỡ chữ trong
 * bảng Kiểu hiển thị phụ đề. */
function SubtitleStyleIcon() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-current text-[8px] font-bold leading-none">
      Aa
    </span>
  );
}

/** Phím bàn phím đơn giản — thay cho emoji ⌨️. */
function KeyboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01" strokeWidth="2.4" />
      <path d="M9 13h6" />
    </svg>
  );
}
