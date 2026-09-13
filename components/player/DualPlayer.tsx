'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import { useDualPlayerSync, useYouTubeDualPlayerSync } from '@/hooks/useDualPlayerSync';
import { KeyboardShortcutsModal } from '@/components/player/KeyboardShortcutsModal';
import { PlayerControls, SPEED_OPTIONS } from '@/components/player/PlayerControls';
import { SubtitlePositionEditor } from '@/components/player/SubtitlePositionEditor';
import { SubtitleSettingsModal } from '@/components/player/SubtitleSettingsModal';
import {
  buildSubtitleAppearance,
  loadSubtitleSettings,
  saveSubtitleSettings,
  DEFAULT_SUBTITLE_SETTINGS,
  type SubtitlePosition,
} from '@/components/player/subtitleStyle';
import type { AudioTrackInfo, SubtitleSegment } from '@/types/domain';

/**
 * Dual Player — UC16.
 *
 * Kiến trúc: nguồn hình (`<video>` cho UPLOAD, IFrame Player cho YOUTUBE) **luôn tắt tiếng**
 * và là nguồn thời gian chuẩn; `<audio>` phát bản lồng tiếng `.mp3` bám theo. Logic đồng bộ nằm
 * trong {@link useDualPlayerSync} (UPLOAD) / {@link useYouTubeDualPlayerSync} (YOUTUBE) — cùng
 * hợp đồng BR-SYNC-01.
 *
 * BR-CHUNK-05 — chọn nguồn audio theo trạng thái track:
 *  - `finalUrl` đã có → phát file đó, offset đồng bộ = 0 (file đánh mốc t=0 từ đầu video).
 *  - Chưa có (`status = PARTIAL`) → phát **playlist** các chunk theo dải thời gian. Mỗi file
 *    chunk tự đánh mốc t=0 ở ĐẦU CHUNK ĐÓ (không phải đầu video) — phải trừ `chunk.startSec`
 *    khi đồng bộ, nếu không audio sẽ bị tua sai vị trí ngay khi đổi sang phát playlist.
 *    Đây là điều làm nên "học ngay khi chunk đầu xong" (BR-CHUNK-03); nếu chỉ chờ
 *    `finalUrl` thì mất toàn bộ lợi ích của Layered Chunking.
 *
 * `videoRef`/`audioRef` nhận từ ngoài (optional) để trang cha dùng chung 1 cặp ref cho cả đồng bộ
 * lẫn ghi nhận tiến độ (F6.2) — không truyền thì tự tạo ref nội bộ.
 *
 * Giao diện tham khảo Udemy (06/09/2026) — thanh điều khiển UI mặc định của CẢ 2 nguồn video bị
 * thay hoàn toàn bằng `<PlayerControls>` tuỳ biến (`controls` bỏ khỏi `<video>`, `playerVars.
 * controls: 0` cho YouTube — xem `useDualPlayerSync.ts`), để giao diện đồng nhất bất kể nguồn
 * phát và có đủ các nút Udemy có (tốc độ, âm lượng, transcript, chất lượng, tự động phát tiếp).
 *
 * Nguồn ÂM THANH THẬT học viên đang nghe đổi theo trạng thái lồng tiếng — âm lượng/tắt tiếng do
 * học viên chỉnh qua `<PlayerControls>` phải áp đúng lên nguồn ĐANG audible, không áp nhầm lên
 * nguồn đang câm lặng:
 *  - Chưa chọn/chưa có bản lồng tiếng (`audioSrc === null`): nguồn audible là chính `<video>`
 *    (UPLOAD) hoặc chính YouTube player (YOUTUBE, xử lý trong hook).
 *  - Đang phát bản lồng tiếng (`audioSrc !== null`): `<video>` luôn bị ép câm (`muted` prop),
 *    nguồn audible là thẻ `<audio>` — xem effect đồng bộ âm lượng/tốc độ bên dưới.
 */

interface DualPlayerProps {
  videoSource: 'UPLOAD' | 'YOUTUBE';
  videoUrl: string;
  /** Chỉ có giá trị khi `videoSource = YOUTUBE`. */
  youtubeId: string | null;
  /** null = đang phát âm thanh gốc của video */
  track: AudioTrackInfo | null;
  posterLabel?: string;
  /** Chỉ dùng được khi `videoSource = UPLOAD` — YouTube không có thẻ `<video>` để gắn ref. */
  videoRef?: RefObject<HTMLVideoElement | null>;
  audioRef?: RefObject<HTMLAudioElement | null>;
  /** Phụ đề gốc — hiện khi `showOriginalSub` bật, đồng bộ theo thời gian phát thật. */
  originalSubtitles?: SubtitleSegment[];
  /** Phụ đề đã dịch, khớp ngôn ngữ đang chọn — hiện khi `showTranslatedSub` bật. */
  translatedSubtitles?: SubtitleSegment[];
  showOriginalSub?: boolean;
  showTranslatedSub?: boolean;
  /** Giao diện tham khảo eJOY (06/09/2026) — nút bật/tắt phụ đề giờ nằm trong bảng "Cài đặt phụ
   * đề" (mở từ icon Cài đặt của thanh điều khiển), thay cho 2 checkbox rời dưới video trước đây. */
  onToggleShowOriginalSub: () => void;
  onToggleShowTranslatedSub: () => void;
  /** Video phát hết — dùng cho tính năng tự động chuyển bài tiếp theo (trang cha tự quyết định). */
  onEnded?: () => void;
  /** Chỉ gọi khi `showTranscript` đang bật, tránh re-render trang cha liên tục lúc panel ẩn. */
  onTimeUpdate?: (sec: number) => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  autoNextEnabled: boolean;
  onToggleAutoNext: () => void;
}

/** Câu đang phát tại `currentSec`, hoặc `null` nếu đang ở khoảng lặng giữa 2 câu. */
function findActiveSegment(segments: SubtitleSegment[], currentSec: number): SubtitleSegment | null {
  return segments.find((s) => currentSec >= s.startSec && currentSec < s.endSec) ?? null;
}

interface ResolvedAudio {
  src: string | null;
  /** Mốc bắt đầu (giây, tuyệt đối theo video) của file đang phát — 0 nếu là `finalUrl`. */
  offsetSec: number;
}

/** UC30 — cho phép trang cha (Gia sư AI, `TutorEmbedded`) ra lệnh tua tới mốc thời gian, bất kể
 * nguồn video là UPLOAD (`<video>`) hay YOUTUBE (IFrame Player API) — 2 cơ chế tua khác hẳn
 * nhau bị `DualPlayer` che giấu hoàn toàn, trang cha không cần biết đang phát nguồn nào. */
export interface DualPlayerHandle {
  seekTo: (seconds: number) => void;
}

/** Chọn URL audio + offset đồng bộ hiện tại theo BR-CHUNK-05. */
function resolveAudio(track: AudioTrackInfo | null, currentSec: number): ResolvedAudio {
  if (!track) {
    return { src: null, offsetSec: 0 };
  }
  if (track.finalUrl) {
    return { src: track.finalUrl, offsetSec: 0 };
  }
  // Chưa ghép xong -> tìm chunk chứa mốc thời gian hiện tại
  const chunk =
    track.chunks.find((c) => currentSec >= c.startSec && currentSec < c.endSec) ?? track.chunks[0];
  return { src: chunk?.fileUrl ?? null, offsetSec: chunk?.startSec ?? 0 };
}

export const DualPlayer = forwardRef<DualPlayerHandle, DualPlayerProps>(function DualPlayer({
  videoSource,
  videoUrl,
  youtubeId,
  track,
  posterLabel = 'khung video bài giảng',
  videoRef: externalVideoRef,
  audioRef: externalAudioRef,
  originalSubtitles = [],
  translatedSubtitles = [],
  showOriginalSub = false,
  showTranslatedSub = false,
  onToggleShowOriginalSub,
  onToggleShowTranslatedSub,
  onEnded,
  onTimeUpdate,
  showTranscript,
  onToggleTranscript,
  autoNextEnabled,
  onToggleAutoNext,
}: DualPlayerProps, ref) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const audioRef = externalAudioRef ?? internalAudioRef;
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  // Giao diện tham khảo Udemy (06/09/2026) — nút phóng to riêng, fullscreen NGUYÊN CẢ KHỐI chứa
  // video (`containerRef`), KHÔNG dùng nút fullscreen có sẵn của thẻ <video> — phụ đề gốc/dịch
  // (`activeOriginal`/`activeTranslated` bên dưới) là phần tử ANH EM với <video>, không phải con
  // của nó, nên fullscreen thẳng <video> sẽ làm mất phụ đề khi phóng to. Fullscreen nguyên khối
  // cha giữ được cả phụ đề lẫn thanh điều khiển gốc của <video>.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current?.requestFullscreen();
    }
  };
  // Thời gian phát hiện tại — nguồn UPLOAD cập nhật qua `onTimeUpdate` của `<video>`; nguồn
  // YOUTUBE được đồng bộ lại từ `useYouTubeDualPlayerSync` bên dưới (đọc thẳng IFrame Player API,
  // độc lập việc có đang lồng tiếng hay không — khác trước đây suy ra từ `<audio>` nên chỉ chạy
  // khi có bản lồng tiếng đang phát, khiến phụ đề gốc không đồng bộ được lúc chưa chọn ngôn ngữ).
  const [currentSec, setCurrentSec] = useState(0);

  // ── Trạng thái điều khiển cho nguồn UPLOAD — nguồn YOUTUBE dùng thẳng controller trả về từ
  // `useYouTubeDualPlayerSync` (đã gộp sẵn, xem bên dưới). Tách 2 bộ vì 2 nguồn có API hoàn toàn
  // khác nhau (thẻ <video> chuẩn HTML vs IFrame Player API).
  const [uploadIsPlaying, setUploadIsPlaying] = useState(false);
  const [uploadDuration, setUploadDuration] = useState(0);
  const [uploadPlaybackRate, setUploadPlaybackRate] = useState(1);
  const [uploadVolume, setUploadVolume] = useState(100);
  const [uploadMuted, setUploadMuted] = useState(false);

  const isYoutube = videoSource === 'YOUTUBE' && !!youtubeId;
  const { src: audioSrc, offsetSec } = resolveAudio(track, currentSec);

  const handleEnded = () => onEnded?.();

  useDualPlayerSync(videoRef, audioRef, {
    enabled: !isYoutube && audioSrc !== null,
    timeOffsetSec: offsetSec,
  });
  const youtube = useYouTubeDualPlayerSync(
    youtubeContainerRef, audioRef, isYoutube ? youtubeId : null,
    { dubActive: audioSrc !== null, timeOffsetSec: offsetSec, onEnded: handleEnded },
  );
  useEffect(() => {
    if (isYoutube) setCurrentSec(youtube.currentSec);
  }, [isYoutube, youtube.currentSec]);

  // Áp âm lượng/tắt tiếng/tốc độ đang chọn (UPLOAD) lên đúng nguồn ĐANG AUDIBLE — chạy lại mỗi
  // khi đổi nguồn (bật/tắt lồng tiếng) để nguồn MỚI audible nhận đúng giá trị ngay, không phải
  // chờ học viên chỉnh lại từ đầu (ví dụ đang chỉnh âm lượng lúc nghe gốc, sau đó bật lồng tiếng).
  useEffect(() => {
    if (isYoutube) return;
    const target = audioSrc !== null ? audioRef.current : videoRef.current;
    if (!target) return;
    target.volume = uploadVolume / 100;
    target.muted = uploadMuted;
    if (audioSrc !== null) {
      target.playbackRate = uploadPlaybackRate;
    }
  }, [isYoutube, audioSrc, uploadVolume, uploadMuted, uploadPlaybackRate, audioRef, videoRef]);

  useEffect(() => {
    onTimeUpdate?.(currentSec);
    // Chỉ đẩy currentSec ra trang cha khi Transcript đang mở — panel đó là nơi DUY NHẤT cần giá
    // trị này ở ngoài `DualPlayer`, tránh trang cha (cây component lớn) re-render nhiều lần/giây
    // một cách vô ích lúc panel đang ẩn (mặc định).
  }, [currentSec, onTimeUpdate]);

  const { seekTo: youtubeSeekTo } = youtube;
  const seekTo = useCallback(
    (seconds: number) => {
      if (isYoutube) {
        youtubeSeekTo(seconds);
      } else if (videoRef.current) {
        videoRef.current.currentTime = seconds;
      }
    },
    [isYoutube, youtubeSeekTo, videoRef],
  );

  useImperativeHandle(ref, () => ({ seekTo }), [seekTo]);

  const handleTogglePlay = () => {
    if (isYoutube) {
      youtube.togglePlay();
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  const handleSetPlaybackRate = (rate: number) => {
    if (isYoutube) youtube.setPlaybackRateLevel(rate);
    else if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const handleSetVolume = (vol: number) => {
    if (isYoutube) {
      youtube.setVolumeLevel(vol);
      return;
    }
    setUploadVolume(vol);
    if (vol > 0 && uploadMuted) setUploadMuted(false);
  };

  const handleToggleMute = () => {
    if (isYoutube) youtube.toggleMute();
    else setUploadMuted((m) => !m);
  };

  const isPlaying = isYoutube ? youtube.isPlaying : uploadIsPlaying;
  const duration = isYoutube ? youtube.duration : uploadDuration;
  const playbackRate = isYoutube ? youtube.playbackRate : uploadPlaybackRate;
  const volume = isYoutube ? youtube.volume : uploadVolume;
  const muted = isYoutube ? youtube.muted : uploadMuted;

  // BUG THẬT (06/09/2026): đổi ngôn ngữ lồng tiếng (hoặc bật lồng tiếng lần đầu) GIỮA LÚC đang
  // phát không tự nghe được — phải bấm dừng/phát lại mới có tiếng. Nguyên nhân: đổi `src` của
  // 1 phần tử `<audio>` khiến trình duyệt tự ĐƯA VỀ TRẠNG THÁI DỪNG (đúng chuẩn HTMLMediaElement),
  // trong khi video/YouTube vẫn đang phát liên tục nên KHÔNG có sự kiện `play` mới nào để
  // `useDualPlayerSync`/`useYouTubeDualPlayerSync` tự gọi lại `audio.play()` — phải tự phát hiện
  // đổi `audioSrc` NGAY TẠI ĐÂY và gọi `.play()` nếu đang phát. Vị trí phát chính xác được vòng
  // kiểm tra lệch 250ms (đã có sẵn trong 2 hook trên) tự sửa ngay sau đó, không cần set thêm.
  const prevAudioSrcRef = useRef<string | null>(null);
  useEffect(() => {
    const changed = audioSrc !== prevAudioSrcRef.current;
    prevAudioSrcRef.current = audioSrc;
    if (!changed || !audioSrc) return;
    const wasPlaying = isYoutube ? youtube.isPlaying : !(videoRef.current?.paused ?? true);
    if (wasPlaying) {
      void audioRef.current?.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chi can theo doi DUNG audioSrc doi, doc isPlaying/ref tai thoi diem do la du
  }, [audioSrc]);

  const activeOriginal = showOriginalSub ? findActiveSegment(originalSubtitles, currentSec) : null;
  const activeTranslated = showTranslatedSub ? findActiveSegment(translatedSubtitles, currentSec) : null;

  // Giao diện tham khảo Udemy (06/09/2026) — phím tắt bàn phím, hoạt động cho CẢ 2 nguồn video.
  // Dùng 1 ref giữ "bản mới nhất" của mọi giá trị/hàm cần dùng thay vì liệt kê hết vào dependency
  // array của effect đăng ký sự kiện — currentSec đổi nhiều lần/giây lúc đang phát, nếu để trong
  // dependency sẽ gỡ/gắn lại listener liên tục, tốn không cần thiết. Gán lại NGAY TRONG THÂN
  // RENDER (không phải trong `useEffect`) — mẫu chuẩn cho "ref luôn mới nhất" của React, không
  // trễ 1 nhịp như gán trong effect.
  const [showShortcuts, setShowShortcuts] = useState(false);
  const keyboardStateRef = useRef({
    currentSec, duration, volume, muted, playbackRate, showShortcuts,
    handleTogglePlay, seekTo, handleSetVolume, handleToggleMute, handleSetPlaybackRate, toggleFullscreen,
  });
  keyboardStateRef.current = {
    currentSec, duration, volume, muted, playbackRate, showShortcuts,
    handleTogglePlay, seekTo, handleSetVolume, handleToggleMute, handleSetPlaybackRate, toggleFullscreen,
  };

  useEffect(() => {
    if (!showShortcuts) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShortcuts(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showShortcuts]);

  // Đăng ký ĐÚNG 1 LẦN (mount) — đọc mọi giá trị cần qua `keyboardStateRef.current` (luôn mới
  // nhất nhờ gán lại mỗi lượt render ở trên) thay vì đóng gói (closure) giá trị cũ.
  useEffect(() => {
    const isEditableTarget = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      // Chỉ xử lý khi khối player này (hoặc không có gì) đang giữ focus — tránh nuốt nhầm phím
      // tắt của khu vực khác trên trang (ô tìm transcript, khung chat Gia sư AI...).
      const active = document.activeElement;
      if (active && active !== document.body && !containerRef.current?.contains(active)) return;

      const s = keyboardStateRef.current;
      if (s.showShortcuts) return; // Esc đóng bảng phím tắt đã xử lý ở effect riêng phía trên

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          s.handleTogglePlay();
          break;
        case 'ArrowLeft': {
          e.preventDefault();
          if (e.shiftKey) {
            const idx = SPEED_OPTIONS.indexOf(s.playbackRate);
            const next = SPEED_OPTIONS[Math.max(0, (idx === -1 ? SPEED_OPTIONS.indexOf(1) : idx) - 1)];
            if (next !== undefined) s.handleSetPlaybackRate(next);
          } else {
            s.seekTo(Math.max(0, s.currentSec - 5));
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (e.shiftKey) {
            const idx = SPEED_OPTIONS.indexOf(s.playbackRate);
            const next = SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, (idx === -1 ? SPEED_OPTIONS.indexOf(1) : idx) + 1)];
            if (next !== undefined) s.handleSetPlaybackRate(next);
          } else {
            s.seekTo(Math.min(s.duration, s.currentSec + 5));
          }
          break;
        }
        case 'ArrowUp':
          e.preventDefault();
          s.handleSetVolume(Math.min(100, (s.muted ? 0 : s.volume) + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          s.handleSetVolume(Math.max(0, (s.muted ? 0 : s.volume) - 10));
          break;
        case 'm':
        case 'M':
          s.handleToggleMute();
          break;
        case 'f':
        case 'F':
          s.toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Giao diện tham khảo eJOY (06/09/2026) — cỡ chữ/kiểu hiển thị/độ đậm nền/vị trí RIÊNG cho
  // từng loại phụ đề, là tuỳ chọn của NGƯỜI XEM (không phải nội dung bài học) nên lưu
  // `localStorage`, áp dụng chung cho mọi bài học thay vì theo từng lesson/course.
  const [subtitleSettings, setSubtitleSettings] = useState(() => loadSubtitleSettings());
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [positionEditMode, setPositionEditMode] = useState(false);

  useEffect(() => {
    saveSubtitleSettings(subtitleSettings);
  }, [subtitleSettings]);

  // "video sẽ dừng phát, tô tối đi" đúng yêu cầu — tạm dừng trước khi vào chế độ kéo-thả vị trí,
  // tránh phụ đề thật (đang chạy theo currentSec) chồng lên 2 khối mẫu đang kéo, gây rối mắt.
  const handleEditPosition = () => {
    setShowSubtitleSettings(false);
    if (isPlaying) handleTogglePlay();
    setPositionEditMode(true);
  };

  const handleResetPositions = () => {
    setSubtitleSettings((prev) => ({
      original: { ...prev.original, position: DEFAULT_SUBTITLE_SETTINGS.original.position },
      translated: { ...prev.translated, position: DEFAULT_SUBTITLE_SETTINGS.translated.position },
    }));
  };

  return (
    <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-card bg-ink">
      {isYoutube ? (
        <div key={youtubeId} ref={youtubeContainerRef} className="h-full w-full" />
      ) : videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          // Chỉ tắt tiếng khi có bản lồng tiếng đang phát qua thẻ <audio> bên dưới — chưa có
          // bản lồng tiếng nào (audioSrc null) thì phát thẳng âm thanh gốc của video.
          muted={audioSrc !== null}
          playsInline
          onTimeUpdate={(e) => setCurrentSec(e.currentTarget.currentTime)}
          onPlay={() => setUploadIsPlaying(true)}
          onPause={() => setUploadIsPlaying(false)}
          onEnded={handleEnded}
          onLoadedMetadata={(e) => setUploadDuration(e.currentTarget.duration)}
          onDurationChange={(e) => setUploadDuration(e.currentTarget.duration)}
          onRateChange={(e) => setUploadPlaybackRate(e.currentTarget.playbackRate)}
          onClick={handleTogglePlay}
          className="h-full w-full cursor-pointer"
        />
      ) : (
        // Chưa nạp video — giữ đúng khung để không lệch layout
        <div className="flex h-full w-full items-center justify-center">
          <span className="rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white/60">
            {posterLabel}
          </span>
        </div>
      )}

      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}

      {!isPlaying && (videoUrl || isYoutube) && (
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label="Phát video"
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2
                     items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {track?.status === 'PARTIAL' && (
        <span
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70
                     px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent" aria-hidden />
          Đang xử lý phần còn lại
        </span>
      )}

      {/* Giao diện tham khảo eJOY (06/09/2026) — mỗi loại phụ đề tự đặt vị trí/kiểu hiển thị
          RIÊNG (`subtitleSettings`), không còn xếp chồng cố định ở giữa-dưới như trước. Ẩn hẳn
          lúc đang chỉnh vị trí (`positionEditMode`) — 2 khối mẫu kéo-thả của `SubtitlePositionEditor`
          đã hiển thị đúng vị trí này rồi, để cả 2 cùng lúc sẽ chồng lên nhau rối mắt. */}
      {!positionEditMode && activeTranslated && (
        <span
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center ${
            buildSubtitleAppearance(subtitleSettings.translated).className
          }`}
          style={{
            left: `${subtitleSettings.translated.position.xPercent}%`,
            top: `${subtitleSettings.translated.position.yPercent}%`,
            ...buildSubtitleAppearance(subtitleSettings.translated).style,
          }}
        >
          {activeTranslated.text}
        </span>
      )}
      {!positionEditMode && activeOriginal && (
        <span
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center ${
            buildSubtitleAppearance(subtitleSettings.original).className
          }`}
          style={{
            left: `${subtitleSettings.original.position.xPercent}%`,
            top: `${subtitleSettings.original.position.yPercent}%`,
            ...buildSubtitleAppearance(subtitleSettings.original).style,
          }}
        >
          {activeOriginal.text}
        </span>
      )}

      <PlayerControls
        isPlaying={isPlaying}
        currentSec={currentSec}
        duration={duration}
        playbackRate={playbackRate}
        volume={volume}
        muted={muted}
        onTogglePlay={handleTogglePlay}
        onSeek={seekTo}
        onSetPlaybackRate={handleSetPlaybackRate}
        onSetVolume={handleSetVolume}
        onToggleMute={handleToggleMute}
        qualities={isYoutube ? youtube.qualities : null}
        quality={isYoutube ? youtube.quality : null}
        onSetQuality={isYoutube ? youtube.setQuality : () => {}}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showTranscript={showTranscript}
        onToggleTranscript={onToggleTranscript}
        showOriginalSub={showOriginalSub}
        onToggleShowOriginalSub={onToggleShowOriginalSub}
        originalSubtitleAvailable={originalSubtitles.length > 0}
        showTranslatedSub={showTranslatedSub}
        onToggleShowTranslatedSub={onToggleShowTranslatedSub}
        translatedSubtitleAvailable={translatedSubtitles.length > 0}
        autoNextEnabled={autoNextEnabled}
        onToggleAutoNext={onToggleAutoNext}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenSubtitleSettings={() => setShowSubtitleSettings(true)}
      />

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showSubtitleSettings && (
        <SubtitleSettingsModal
          settings={subtitleSettings}
          onChange={setSubtitleSettings}
          onClose={() => setShowSubtitleSettings(false)}
          onEditPosition={handleEditPosition}
        />
      )}

      {positionEditMode && (
        <SubtitlePositionEditor
          containerRef={containerRef}
          originalSettings={subtitleSettings.original}
          translatedSettings={subtitleSettings.translated}
          originalText={
            findActiveSegment(originalSubtitles, currentSec)?.text ?? originalSubtitles[0]?.text ?? '(chưa có phụ đề gốc)'
          }
          translatedText={
            findActiveSegment(translatedSubtitles, currentSec)?.text ?? translatedSubtitles[0]?.text ?? '(chưa có phụ đề dịch)'
          }
          onChangeOriginalPosition={(pos: SubtitlePosition) =>
            setSubtitleSettings((prev) => ({ ...prev, original: { ...prev.original, position: pos } }))
          }
          onChangeTranslatedPosition={(pos: SubtitlePosition) =>
            setSubtitleSettings((prev) => ({ ...prev, translated: { ...prev.translated, position: pos } }))
          }
          onResetPositions={handleResetPositions}
          onDone={() => setPositionEditMode(false)}
        />
      )}
    </div>
  );
});
