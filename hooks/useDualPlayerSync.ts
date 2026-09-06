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
  playVideo(): void;
  pauseVideo(): void;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  setVolume(volume: number): void;
  getVolume(): number;
  getAvailableQualityLevels(): string[];
  setPlaybackQuality(quality: string): void;
  getPlaybackQuality(): string;
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
  /** Giao diện tham khảo Udemy (06/09/2026) — video kết thúc, dùng cho tính năng tự động chuyển
   * sang bài học tiếp theo (trang cha quyết định, hook chỉ báo sự kiện). */
  onEnded?: () => void;
}

/** Điều khiển thanh control tuỳ biến (Udemy-style) cho nguồn YouTube — thay hẳn UI có sẵn của
 * YouTube (`playerVars.controls = 0`). `volume`/`muted` LUÔN phản ánh đúng nguồn ĐANG PHÁT ÂM
 * THANH THẬT: thẻ `<audio>` (bản lồng tiếng) khi `dubActive`, ngược lại là chính YouTube player —
 * y hệt quy tắc `muted={audioSrc !== null}` áp cho thẻ `<video>` ở nguồn UPLOAD. */
export interface YouTubePlayerController {
  currentSec: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  /** Mã chất lượng thô của YouTube (`hd1080`/`hd720`/`large`/`medium`/`small`/`tiny`/`auto`),
   * rỗng nếu API chưa sẵn sàng trả về danh sách. */
  qualities: string[];
  quality: string;
  seekTo: (seconds: number) => void;
  togglePlay: () => void;
  setPlaybackRateLevel: (rate: number) => void;
  setVolumeLevel: (volume: number) => void;
  toggleMute: () => void;
  setQuality: (quality: string) => void;
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
  { dubActive = false, timeOffsetSec = 0, onEnded }: UseYouTubeDualPlayerSyncOptions = {},
): YouTubePlayerController {
  const playerRef = useRef<YouTubePlayerLike | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(timeOffsetSec);
  const dubActiveRef = useRef(dubActive);
  const onEndedRef = useRef(onEnded);
  const [currentSec, setCurrentSec] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  // 100 = âm lượng đầy — mặc định của YouTube lẫn thẻ <audio>/<video> gốc.
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [quality, setQualityState] = useState('auto');
  // Đọc được giá trị MỚI NHẤT bên trong closure của sự kiện YT (tạo 1 lần lúc mount) mà không phải
  // gỡ/gắn lại player mỗi khi học viên chỉnh âm lượng — cùng khuôn với `offsetRef`/`dubActiveRef`.
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);

  useEffect(() => {
    offsetRef.current = timeOffsetSec;
  }, [timeOffsetSec]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    dubActiveRef.current = dubActive;
    const player = playerRef.current;
    if (!player) return;
    // Nguồn phát ÂM THANH THẬT đổi theo `dubActive` — âm lượng/tắt tiếng do học viên chỉnh phải
    // đi theo đúng nguồn đang audible, không áp nhầm lên nguồn đang im lặng.
    if (dubActive) {
      player.mute();
      const audio = audioRef.current;
      if (audio) {
        audio.volume = volumeRef.current / 100;
        audio.muted = mutedRef.current;
      }
    } else {
      audioRef.current?.pause();
      player.setVolume(volumeRef.current);
      if (mutedRef.current) player.mute();
      else player.unMute();
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
        // Giao diện tham khảo Udemy (06/09/2026) — `controls: 0` để tự vẽ thanh điều khiển riêng
        // (`PlayerControls.tsx`) thay UI mặc định của YouTube, đồng bộ giao diện với nguồn UPLOAD.
        playerVars: { controls: 0, modestbranding: 1, rel: 0, disablekb: 1 },
        events: {
          onReady: (event) => {
            if (dubActiveRef.current) {
              event.target.mute();
            } else {
              event.target.setVolume(volumeRef.current);
              if (mutedRef.current) event.target.mute();
            }
            setDuration(event.target.getDuration());
            setPlaybackRateState(event.target.getPlaybackRate());
            setQualities(event.target.getAvailableQualityLevels());
            setQualityState(event.target.getPlaybackQuality());
            playerRef.current = event.target;
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === YT_STATE.PLAYING || event.data === YT_STATE.BUFFERING);
            setQualities(event.target.getAvailableQualityLevels());
            setQualityState(event.target.getPlaybackQuality());
            if (event.data === YT_STATE.ENDED) {
              onEndedRef.current?.();
            }
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
            setPlaybackRateState(event.data);
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
        setDuration(p.getDuration());
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

  /** UC30 — tua video theo mốc thời gian trích dẫn của Gia sư AI (BR-TUTOR-02), cũng dùng cho
   * thanh scrubber/nút tua 5s của control bar tuỳ biến. `allowSeekAhead: true` để tua được tới
   * đoạn video YouTube chưa buffer, không chỉ trong phần đã tải. */
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === YT_STATE.PLAYING || state === YT_STATE.BUFFERING) p.pauseVideo();
    else p.playVideo();
  }, []);

  const setPlaybackRateLevel = useCallback(
    (rate: number) => {
      playerRef.current?.setPlaybackRate(rate);
      setPlaybackRateState(rate);
      // Không chờ `onPlaybackRateChange` (có trình duyệt bắn trễ) — đổi tốc độ audio lồng tiếng
      // ngay lập tức nếu đang là nguồn audible.
      if (dubActiveRef.current && audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
    [audioRef],
  );

  const setVolumeLevel = useCallback(
    (vol: number) => {
      setVolume(vol);
      if (dubActiveRef.current) {
        const audio = audioRef.current;
        if (audio) audio.volume = vol / 100;
      } else {
        playerRef.current?.setVolume(vol);
      }
      if (vol > 0 && mutedRef.current) setMuted(false);
    },
    [audioRef],
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (dubActiveRef.current) {
        const audio = audioRef.current;
        if (audio) audio.muted = next;
      } else if (next) {
        playerRef.current?.mute();
      } else {
        playerRef.current?.unMute();
      }
      return next;
    });
  }, [audioRef]);

  const setQuality = useCallback((q: string) => {
    playerRef.current?.setPlaybackQuality(q);
    setQualityState(q);
  }, []);

  return {
    currentSec,
    duration,
    isPlaying,
    playbackRate,
    volume,
    muted,
    qualities,
    quality,
    seekTo,
    togglePlay,
    setPlaybackRateLevel,
    setVolumeLevel,
    toggleMute,
    setQuality,
  };
}
