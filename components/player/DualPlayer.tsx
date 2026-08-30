'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import { useDualPlayerSync, useYouTubeDualPlayerSync } from '@/hooks/useDualPlayerSync';
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

/** UC30 — cho phép trang cha (Gia sư AI, `TutorPanel`) ra lệnh tua tới mốc thời gian, bất kể
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
}: DualPlayerProps, ref) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const audioRef = externalAudioRef ?? internalAudioRef;
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  // Thời gian phát hiện tại — nguồn UPLOAD cập nhật qua `onTimeUpdate` của `<video>`; nguồn
  // YOUTUBE được đồng bộ lại từ `useYouTubeDualPlayerSync` bên dưới (đọc thẳng IFrame Player API,
  // độc lập việc có đang lồng tiếng hay không — khác trước đây suy ra từ `<audio>` nên chỉ chạy
  // khi có bản lồng tiếng đang phát, khiến phụ đề gốc không đồng bộ được lúc chưa chọn ngôn ngữ).
  const [currentSec, setCurrentSec] = useState(0);

  const isYoutube = videoSource === 'YOUTUBE' && !!youtubeId;
  const { src: audioSrc, offsetSec } = resolveAudio(track, currentSec);

  useDualPlayerSync(videoRef, audioRef, {
    enabled: !isYoutube && audioSrc !== null,
    timeOffsetSec: offsetSec,
  });
  const { currentSec: youtubeSec, seekTo: youtubeSeekTo } = useYouTubeDualPlayerSync(
    youtubeContainerRef, audioRef, isYoutube ? youtubeId : null,
    { dubActive: audioSrc !== null, timeOffsetSec: offsetSec },
  );
  useEffect(() => {
    if (isYoutube) setCurrentSec(youtubeSec);
  }, [isYoutube, youtubeSec]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (isYoutube) {
        youtubeSeekTo(seconds);
      } else if (videoRef.current) {
        videoRef.current.currentTime = seconds;
      }
    },
  }), [isYoutube, youtubeSeekTo, videoRef]);

  const activeOriginal = showOriginalSub ? findActiveSegment(originalSubtitles, currentSec) : null;
  const activeTranslated = showTranslatedSub ? findActiveSegment(translatedSubtitles, currentSec) : null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-ink">
      {isYoutube ? (
        <div key={youtubeId} ref={youtubeContainerRef} className="h-full w-full" />
      ) : videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          // Chỉ tắt tiếng khi có bản lồng tiếng đang phát qua thẻ <audio> bên dưới — chưa có
          // bản lồng tiếng nào (audioSrc null) thì phát thẳng âm thanh gốc của video.
          muted={audioSrc !== null}
          controls
          playsInline
          onTimeUpdate={(e) => setCurrentSec(e.currentTarget.currentTime)}
          className="h-full w-full"
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

      {track?.status === 'PARTIAL' && (
        <span
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70
                     px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent-glow" aria-hidden />
          Đang xử lý phần còn lại
        </span>
      )}

      {(activeTranslated || activeOriginal) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center">
          {activeTranslated && (
            <span className="rounded-md bg-ink/80 px-3 py-1.5 text-base font-semibold leading-snug text-white shadow-lg">
              {activeTranslated.text}
            </span>
          )}
          {activeOriginal && (
            <span className="rounded-md bg-ink/60 px-2.5 py-1 text-sm leading-snug text-white/85 shadow">
              {activeOriginal.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
