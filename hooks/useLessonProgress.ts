'use client';

import { useEffect, useRef } from 'react';
import { lessonProgressApi } from '@/lib/api/lessonProgress';
import { getAccessToken } from '@/lib/auth/token';

/** BR-PROGRESS-03 — chu kỳ gửi tiến độ định kỳ trong lúc đang xem. */
const SEND_INTERVAL_MS = 15000;

/** Nhịp cộng dồn thời gian phát thực tế, tách khỏi `timeupdate` (tần suất không đều giữa các trình duyệt). */
const ACCUMULATE_INTERVAL_MS = 1000;

interface UseLessonProgressOptions {
  /** Vị trí đã xem dở lần trước (BR-PROGRESS-03) — tự tua tới khi video sẵn sàng, 1 lần duy nhất. */
  initialPositionSec?: number;
  enabled?: boolean;
}

/**
 * UC21 — ghi nhận tiến độ xem THẬT của thẻ `<video>` đang hiển thị (nguồn hình chuẩn của Dual
 * Player, kể cả khi đang phát audio lồng tiếng — video luôn là master clock theo BR-SYNC-01).
 *
 * BR-PROGRESS-01: `watchedSec` cộng dồn theo THỜI GIAN THỰC trôi qua trong lúc `play` và không
 * `seeking` — dùng đồng hồ hệ thống (không phải delta `video.currentTime`) nên tua nhanh/lùi
 * không bao giờ được tính, kể cả tua một khoảng ngắn nhiều lần liên tiếp.
 *
 * Gửi định kỳ mỗi 15s + ngay khi `pause`/`seeking` + lúc rời trang (`pagehide`, dùng
 * `fetch keepalive` — xem `lessonProgressApi.recordOnUnload`).
 */
export function useLessonProgress(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  lessonId: number,
  { initialPositionSec = 0, enabled = true }: UseLessonProgressOptions = {},
): void {
  const watchedSecRef = useRef(0);
  const lastPositionRef = useRef(initialPositionSec);
  const hasSeekedToInitialRef = useRef(false);

  useEffect(() => {
    hasSeekedToInitialRef.current = false;
    lastPositionRef.current = initialPositionSec;
  }, [lessonId, initialPositionSec]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled || !getAccessToken()) {
      return;
    }

    let accumulateTimer: ReturnType<typeof setInterval> | null = null;

    const send = () => {
      lessonProgressApi
        .record(lessonId, {
          watchedSec: Math.round(watchedSecRef.current),
          lastPositionSec: Math.round(lastPositionRef.current),
        })
        .catch(() => {
          // Mất mạng tạm thời — lần gửi định kỳ tiếp theo sẽ tự bù (watchedSec là tích lũy).
        });
    };

    const startAccumulating = () => {
      if (accumulateTimer !== null) return;
      accumulateTimer = setInterval(() => {
        if (!video.seeking) {
          watchedSecRef.current += ACCUMULATE_INTERVAL_MS / 1000;
        }
      }, ACCUMULATE_INTERVAL_MS);
    };

    const stopAccumulating = () => {
      if (accumulateTimer !== null) {
        clearInterval(accumulateTimer);
        accumulateTimer = null;
      }
    };

    const handleLoadedMetadata = () => {
      if (!hasSeekedToInitialRef.current && initialPositionSec > 0) {
        video.currentTime = initialPositionSec;
        hasSeekedToInitialRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      lastPositionRef.current = video.currentTime;
    };

    const handlePlay = () => startAccumulating();

    const handlePause = () => {
      stopAccumulating();
      send();
    };

    const handleSeeking = () => stopAccumulating();

    const handleSeeked = () => {
      lastPositionRef.current = video.currentTime;
      send();
      if (!video.paused) {
        startAccumulating();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    // <video> có sẵn metadata trước khi effect này chạy (vd. đổi ref giữa 2 <video> đã tải) —
    // sự kiện `loadedmetadata` sẽ không bắn lại, phải tự kiểm tra ngay.
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    const sendIntervalId = setInterval(send, SEND_INTERVAL_MS);

    const handlePageHide = () => {
      lessonProgressApi.recordOnUnload(lessonId, {
        watchedSec: Math.round(watchedSecRef.current),
        lastPositionSec: Math.round(lastPositionRef.current),
      });
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('pagehide', handlePageHide);
      stopAccumulating();
      clearInterval(sendIntervalId);
      // Rời bài học (chuyển route) cũng phải gửi nốt phần chưa kịp gửi — không đợi tới pagehide
      // vì Next.js điều hướng phía client không kích hoạt sự kiện đó.
      if (!video.paused) {
        send();
      }
    };
  }, [videoRef, lessonId, enabled, initialPositionSec]);
}
