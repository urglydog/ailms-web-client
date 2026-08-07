/**
 * Dữ liệu giả cho màn Dual Player (UC16, UC17) — chưa tới giai đoạn xử lý lồng tiếng
 * thật (Giai đoạn 5). Duyệt khóa công khai (UC09, UC10) và đánh giá (UC23) đã chuyển
 * sang API thật (Giai đoạn 2) — xem `lib/api/publicCourses.ts`, `lib/api/reviews.ts`.
 */

import type { DubLanguage, PlayerLesson } from '@/types/domain';

/** 5 ngôn ngữ khớp seed `voice_mappings` của backend (BR-DUB-07). */
export const MOCK_LANGUAGES: DubLanguage[] = [
  { code: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳', available: true },
  { code: 'en-US', label: 'English', flag: '🇺🇸', available: true },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵', available: false },
  { code: 'ko-KR', label: '한국어', flag: '🇰🇷', available: false },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳', available: false },
];

/**
 * Bài học cho màn Dual Player.
 *
 * `activeTrack` để `null` có chủ đích: đó là trạng thái "chưa có bản lồng tiếng",
 * dùng để hiển thị panel kích hoạt (UC18). Đổi `MOCK_ACTIVE_TRACK` vào để xem
 * trạng thái đang phát.
 */
export function getPlayerLesson(lessonId: number): PlayerLesson {
  return {
    lessonId,
    lessonTitle: 'Giới thiệu khoá học',
    courseId: 1,
    courseTitle: 'Machine Learning với Python từ số 0',
    courseSlug: 'khoa-hoc-1',
    videoSource: 'UPLOAD',
    videoUrl: '',
    youtubeId: null,
    durationSec: 480,
    sourceLanguage: 'en-US',
    languages: MOCK_LANGUAGES,
    activeTrack: null,
    lastPositionSec: 0,
  };
}

/** Các bước pipeline hiển thị ở panel tiến độ (UC20). Khớp thứ tự thật của BR-DUB-01..03. */
export const MOCK_PIPELINE_STEPS = [
  { key: 'stt', label: 'Bóc tách lời thoại (Whisper)', done: true, active: false },
  { key: 'translate', label: 'Dịch ngữ cảnh 3 bước (Gemini)', done: false, active: true },
  { key: 'tts', label: 'Tổng hợp giọng đọc (Edge-TTS)', done: false, active: false },
];
