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
 * Giai đoạn 6 sẽ bổ sung: nguồn YouTube qua IFrame API, ghi tiến độ mỗi 15 giây
 * (BR-PROGRESS-03), và tính `watchedSec` không cộng đoạn tua nhanh (BR-PROGRESS-01).
 */

interface DualPlayerProps {
  videoUrl: string;
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

export function DualPlayer({ videoUrl, track, posterLabel = 'khung video bài giảng' }: DualPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSec, setCurrentSec] = useState(0);

  const audioSrc = resolveAudioSrc(track, currentSec);

  // Chỉ đồng bộ khi thật sự có bản lồng tiếng để phát
  useDualPlayerSync(videoRef, audioRef, { enabled: audioSrc !== null });

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-ink">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          // muted là BẮT BUỘC: mọi âm thanh phải đến từ thẻ <audio> bên dưới
          muted
          controls
          playsInline
          onTimeUpdate={(e) => setCurrentSec(e.currentTarget.currentTime)}
          className="h-full w-full"
        />
      ) : (
        // Giai đoạn 0 chưa có video thật — giữ đúng khung để không lệch layout
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
    </div>
  );
}
