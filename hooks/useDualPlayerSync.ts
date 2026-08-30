'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  /**
   * Mốc bắt đầu (giây, tuyệt đối theo video) của file audio đang tải.
   *
   * Khi `AudioTrack.status = PARTIAL`, mỗi file chunk do `dubbing_service.py` sinh ra tự
   * đánh mốc t=0 ở **đầu chunk đó**, không phải đầu video — khác với `finalUrl` (t=0 =
   * đầu video). Nếu không trừ offset này, mọi thao tác đồng bộ (`seeked`, vòng kiểm 250ms)
   * sẽ tua audio sai vị trí ngay khi đang phát playlist chunk. Mặc định 0 (đúng cho
   * `finalUrl` hoặc chunk đầu tiên có `startSec = 0`).
   */
  timeOffsetSec?: number;
}

export function useDualPlayerSync(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  { enabled = true, timeOffsetSec = 0 }: UseDualPlayerSyncOptions = {},
) {
  // Giữ trong ref để interval không phải tạo lại khi component re-render
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Offset đổi mỗi khi phát sang chunk khác (~10 phút/lần) — dùng ref để không phải
  // gỡ/gắn lại listener mỗi lần đổi, chỉ đọc giá trị mới nhất trong closure có sẵn.
  const offsetRef = useRef(timeOffsetSec);

  useEffect(() => {
    offsetRef.current = timeOffsetSec;
  }, [timeOffsetSec]);

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
      audio.currentTime = Math.max(0, video.currentTime - offsetRef.current);
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
      const targetAudioTime = Math.max(0, video.currentTime - offsetRef.current);
      if (Math.abs(targetAudioTime - audio.currentTime) > DRIFT_TOLERANCE_SEC) {
        audio.currentTime = targetAudioTime;
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
 * Hiện thực đầy đủ ở {@link useYouTubeDualPlayerSync} (Giai đoạn 6, UC16).
 */
export interface YouTubePlayerLike {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  mute(): void;
  unMute(): void;
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

/** Sự kiện tối thiểu cần dùng — không cài `@types/youtube`, tự khai báo phần dùng tới. */
interface YouTubePlayerEvent {
  target: YouTubePlayerLike;
  data: number;
}

interface YouTubePlayerConstructorOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    onPlaybackRateChange?: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeIframeApi {
  Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerConstructorOptions,
  ) => YouTubePlayerLike & { destroy(): void };
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | null = null;

/** Nạp script `iframe_api` đúng 1 lần cho cả trang, dù mở nhiều `DualPlayer` liên tiếp. */
function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }
  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT as YouTubeIframeApi);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

interface UseYouTubeDualPlayerSyncOptions {
  /** Có bản lồng tiếng đang phát qua `<audio>` hay không. false = để YouTube tự phát tiếng gốc. */
  dubActive?: boolean;
  /** Xem giải thích ở {@link UseDualPlayerSyncOptions.timeOffsetSec} — cùng ý nghĩa. */
  timeOffsetSec?: number;
}

/**
 * Đồng bộ Dual Player khi nguồn video là YouTube — cùng hợp đồng BR-SYNC-01 với
 * {@link useDualPlayerSync} (4 sự kiện tương đương, vòng kiểm 250ms) nhưng đọc/ghi thời gian qua
 * IFrame Player API thay vì thẻ `<video>` thường.
 *
 * Player luôn được tạo khi có `youtubeId` (kể cả chưa chọn ngôn ngữ lồng tiếng — video YouTube
 * vẫn phải hiện ra và tự phát tiếng gốc); `dubActive` chỉ quyết định có `mute()` video + đồng bộ
 * `<audio>` theo hay không, đổi được giữa chừng khi học viên chọn/bỏ chọn ngôn ngữ.
 *
 * Khác biệt quan trọng: dùng sự kiện `onPlaybackRateChange` có sẵn của IFrame API để đồng bộ
 * tốc độ (không cần polling); trạng thái `BUFFERING` được coi như `pause` — video đứng chờ
 * buffer mà audio chạy tiếp thì lệch vĩnh viễn, vòng kiểm 250ms không cứu được vì nó chỉ so
 * thời gian chứ không biết video có đang thật sự chạy hay không.
 */
/**
 * `currentSec` trả về là thời gian THẬT của video YouTube (`player.getCurrentTime()`), độc lập
 * với `dubActive`/`timeOffsetSec` — dùng cho phụ đề (cần đồng bộ kể cả khi chưa chọn ngôn ngữ lồng
 * tiếng), khác hẳn vòng đồng bộ `<audio>` bên dưới vốn chỉ chạy khi có bản lồng tiếng đang phát.
 */
export function useYouTubeDualPlayerSync(
  containerRef: React.RefObject<HTMLElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  youtubeId: string | null,
  { dubActive = false, timeOffsetSec = 0 }: UseYouTubeDualPlayerSyncOptions = {},
): { currentSec: number; seekTo: (seconds: number) => void } {
  const playerRef = useRef<YouTubePlayerLike | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(timeOffsetSec);
  const dubActiveRef = useRef(dubActive);
  const [currentSec, setCurrentSec] = useState(0);

  useEffect(() => {
    offsetRef.current = timeOffsetSec;
  }, [timeOffsetSec]);

  useEffect(() => {
    dubActiveRef.current = dubActive;
    const player = playerRef.current;
    if (!player) return;
    if (dubActive) {
      player.mute();
    } else {
      player.unMute();
      audioRef.current?.pause();
    }
  }, [dubActive, audioRef]);

  useEffect(() => {
    if (!youtubeId || !containerRef.current) {
      return;
    }

    let cancelled = false;
    let player: (YouTubePlayerLike & { destroy(): void }) | null = null;

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) {
        return;
      }
      player = new YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: { controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (event) => {
            if (dubActiveRef.current) {
              event.target.mute();
            }
            playerRef.current = event.target;
          },
          onStateChange: (event) => {
            const audio = audioRef.current;
            if (!audio || !dubActiveRef.current) return;
            if (event.data === YT_STATE.PLAYING) {
              void audio.play().catch(() => {
                // Autoplay bị chặn khi chưa có tương tác — lần play tiếp theo sẽ thành công.
              });
            } else if (event.data === YT_STATE.PAUSED || event.data === YT_STATE.BUFFERING) {
              audio.pause();
            }
          },
          onPlaybackRateChange: (event) => {
            const audio = audioRef.current;
            if (audio && dubActiveRef.current) {
              audio.playbackRate = event.data;
            }
          },
        },
      });
    });

    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (p) {
        setCurrentSec(p.getCurrentTime());
      }
      const audio = audioRef.current;
      if (!dubActiveRef.current || !audio || !p || p.getPlayerState() !== YT_STATE.PLAYING) {
        return;
      }
      const targetAudioTime = Math.max(0, p.getCurrentTime() - offsetRef.current);
      if (Math.abs(targetAudioTime - audio.currentTime) > DRIFT_TOLERANCE_SEC) {
        audio.currentTime = targetAudioTime;
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      playerRef.current = null;
      player?.destroy();
    };
  }, [containerRef, audioRef, youtubeId]);

  /** UC30 — tua video theo mốc thời gian trích dẫn của Gia sư AI (BR-TUTOR-02). `allowSeekAhead:
   * true` để tua được tới đoạn video YouTube chưa buffer, không chỉ trong phần đã tải. */
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  return { currentSec, seekTo };
}
