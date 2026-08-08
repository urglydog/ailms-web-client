'use client';

import { useRef, useState } from 'react';
import { useDualPlayerSync } from '@/hooks/useDualPlayerSync';
import type { AudioTrackInfo } from '@/types/domain';

/**
 * Dual Player — UC16.
 *
 * Kiến trúc: `<video>` **luôn tắt tiếng** làm nguồn hình và nguồn thời gian chuẩn;
 * `<audio>` phát bản lồng tiếng `.mp3` bám theo. Logic đồng bộ nằm trong
 * {@link useDualPlayerSync} (BR-SYNC-01).
 *
 * BR-CHUNK-05 — chọn nguồn audio theo trạng thái track:
 *  - `finalUrl` đã có → phát file đó.
 *  - Chưa có (`status = PARTIAL`) → phát **playlist** các chunk theo dải thời gian.
 *    Đây là điều làm nên "học ngay khi chunk đầu xong" (BR-CHUNK-03); nếu chỉ chờ
 *    `finalUrl` thì mất toàn bộ lợi ích của Layered Chunking.
 *
 * Giai đoạn 6 sẽ bổ sung: nguồn YouTube qua IFrame API (đồng bộ audio lồng tiếng thật), ghi
 * tiến độ mỗi 15 giây (BR-PROGRESS-03), và tính `watchedSec` không cộng đoạn tua nhanh
 * (BR-PROGRESS-01). Ở đây (chưa có audio lồng tiếng nào — `track` luôn null) nguồn YouTube chỉ
 * cần nhúng iframe phát thẳng audio gốc, không cần IFrame Player API.
 */

interface DualPlayerProps {
  videoSource: 'UPLOAD' | 'YOUTUBE';
  videoUrl: string;
  /** Chỉ có giá trị khi `videoSource = YOUTUBE`. */
  youtubeId: string | null;
  /** null = đang phát âm thanh gốc của video */
  track: AudioTrackInfo | null;
  posterLabel?: string;
}

/** Chọn URL audio hiện tại theo BR-CHUNK-05. */
function resolveAudioSrc(track: AudioTrackInfo | null, currentSec: number): string | null {
  if (!track) {
    return null;
  }
  if (track.finalUrl) {
    return track.finalUrl;
  }
  // Chưa ghép xong -> tìm chunk chứa mốc thời gian hiện tại
  const chunk = track.chunks.find((c) => currentSec >= c.startSec && currentSec < c.endSec);
  return chunk?.fileUrl ?? track.chunks[0]?.fileUrl ?? null;
}

export function DualPlayer({
  videoSource,
  videoUrl,
  youtubeId,
  track,
  posterLabel = 'khung video bài giảng',
}: DualPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSec, setCurrentSec] = useState(0);

  const audioSrc = resolveAudioSrc(track, currentSec);
  const isYoutube = videoSource === 'YOUTUBE' && !!youtubeId;

  // Chỉ đồng bộ khi thật sự có bản lồng tiếng để phát (chưa áp dụng cho nguồn YouTube — xem
  // docblock của component: đồng bộ YouTube cần IFrame Player API riêng, để dành Giai đoạn 6).
  useDualPlayerSync(videoRef, audioRef, { enabled: !isYoutube && audioSrc !== null });

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-ink">
      {isYoutube ? (
        <iframe
          key={youtubeId}
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Video bài giảng"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
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

      {!isYoutube && audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}

      {track?.status === 'PARTIAL' && (
        <span
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70
                     px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent-glow" aria-hidden />
          Đang xử lý phần còn lại
        </span>
      )}
    </div>
  );
}
