'use client';

import { useEffect, useRef } from 'react';

/**
 * Đồng bộ Dual Player — hiện thực BR-SYNC-01.
 *
 * Kiến trúc: thẻ `<video>` **luôn bị tắt tiếng** và là nguồn thời gian chuẩn
 * (master clock); thẻ `<audio>` chứa bản lồng tiếng `.mp3` bám theo.
 *
 * Bốn điều bắt buộc, thiếu một cái là lệch tiếng:
 *
 * 1. **Vòng kiểm định kỳ 250 ms** — sửa độ lệch tích luỹ do audio và video decode
 *    với tốc độ khác nhau.
 * 2. **Chuyển tiếp đủ 4 sự kiện** `play` / `pause` / `seeked` / `ratechange`.
 *    `ratechange` là cái hay bị bỏ sót nhất: học viên đổi tốc độ video mà audio
 *    giữ nguyên thì lệch tăng dần và không bao giờ tự hết.
 * 3. **Dọn listener khi unmount** — nếu không, đổi bài học liên tục sẽ tích luỹ
 *    listener và rò bộ nhớ.
 * 4. **Video luôn `muted`** — nếu không, người học nghe cả tiếng gốc lẫn tiếng lồng.
 *
 * ⚠️ `TODO(doc)`: ngưỡng lệch cho phép (`DRIFT_TOLERANCE_SEC`) hiện lấy 0.2s theo
 * `lms-frontend-rules`. Bảng Quality Metrics §NFR của KLTN để trống ô này, cần đối
 * chiếu bản Word rồi chốt lại.
 */

/** Chu kỳ kiểm tra độ lệch, đơn vị ms (BR-SYNC-01). */
const SYNC_INTERVAL_MS = 250;

/** Lệch quá ngưỡng này (giây) thì gán lại `audio.currentTime`. */
const DRIFT_TOLERANCE_SEC = 0.2;

interface UseDualPlayerSyncOptions {
  /** Tạm dừng đồng bộ khi đang phát âm thanh gốc (chưa chọn bản lồng tiếng). */
  enabled?: boolean;
}

export function useDualPlayerSync(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  { enabled = true }: UseDualPlayerSyncOptions = {},
) {
  // Giữ trong ref để interval không phải tạo lại khi component re-render
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !enabled) {
      return;
    }

    // Video là luồng hình, mọi âm thanh đến từ thẻ audio
    video.muted = true;

    const handlePlay = () => {
      void audio.play().catch(() => {
        // Browser chặn autoplay khi chưa có tương tác người dùng — bỏ qua,
        // lần bấm play tiếp theo sẽ thành công.
      });
    };

    const handlePause = () => audio.pause();

    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
    };

    /** Không được bỏ sót: đổi tốc độ video mà audio giữ nguyên là lệch vĩnh viễn. */
    const handleRateChange = () => {
      audio.playbackRate = video.playbackRate;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ratechange', handleRateChange);

    intervalRef.current = setInterval(() => {
      if (video.paused) {
        return;
      }
      if (Math.abs(video.currentTime - audio.currentTime) > DRIFT_TOLERANCE_SEC) {
        audio.currentTime = video.currentTime;
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ratechange', handleRateChange);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoRef, audioRef, enabled]);
}

/**
 * Biến thể cho nguồn YouTube (`Lesson.videoSource = YOUTUBE`).
 *
 * Khác biệt so với thẻ `<video>` thường:
 *  - Thời gian đọc qua `getCurrentTime()`, tua bằng `seekTo()` của IFrame Player API.
 *  - Player **luôn** phải gọi `mute()`.
 *  - Trạng thái `BUFFERING` (mã 3) phải **tạm dừng audio**: nếu không, video đứng
 *    chờ buffer mà audio chạy tiếp thì lệch vĩnh viễn và vòng kiểm 250 ms cũng
 *    không cứu được vì nó chỉ so thời gian, không biết video đang đứng.
 *
 * Sẽ hiện thực đầy đủ ở Giai đoạn 6 cùng UC16; ở đây khai báo trước để hợp đồng
 * rõ ràng và test viết được sớm.
 */
export interface YouTubePlayerLike {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  mute(): void;
  getPlaybackRate(): number;
}

/** Mã trạng thái của YouTube IFrame Player API. */
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
