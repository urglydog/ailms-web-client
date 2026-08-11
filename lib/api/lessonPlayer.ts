import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { AudioChunkInfo, AudioTrackInfo, DubLanguage, PlayerLesson, TrackStatus } from '@/types/domain';

/** Cờ hiển thị theo mã ngôn ngữ — thuần trang trí (aria-hidden), không ảnh hưởng logic BR-DUB-07. */
const LANGUAGE_FLAGS: Record<string, string> = {
  vi: '🇻🇳',
  en: '🇺🇸',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
};

function flagFor(code: string): string {
  const primary = code.split('-')[0]?.toLowerCase() ?? code;
  return LANGUAGE_FLAGS[primary] ?? '🌐';
}

interface RawAudioChunk {
  chunkIndex: number;
  startSec: number;
  endSec: number;
  fileUrl: string;
}

interface RawAudioTrack {
  id: number;
  language: string;
  status: TrackStatus;
  finalUrl: string | null;
  durationSec: number;
  chunks: RawAudioChunk[];
}

interface RawLanguage {
  code: string;
  label: string;
  available: boolean;
  track: RawAudioTrack | null;
}

interface RawEnrolledPlayerLesson {
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  videoSource: 'UPLOAD' | 'YOUTUBE';
  videoUrl: string;
  youtubeId: string | null;
  durationSec: number;
  sourceLanguage: string | null;
  isPreview: boolean;
  lastPositionSec: number;
  languages: RawLanguage[];
}

function toAudioTrackInfo(raw: RawAudioTrack): AudioTrackInfo {
  const chunks: AudioChunkInfo[] = raw.chunks.map((c) => ({
    chunkIndex: c.chunkIndex,
    startSec: c.startSec,
    endSec: c.endSec,
    fileUrl: c.fileUrl,
  }));
  return {
    id: raw.id,
    language: raw.language,
    status: raw.status,
    finalUrl: raw.finalUrl,
    durationSec: raw.durationSec,
    chunks,
  };
}

function toDubLanguage(raw: RawLanguage): DubLanguage {
  return {
    code: raw.code,
    label: raw.label,
    flag: flagFor(raw.code),
    available: raw.available,
    track: raw.track ? toAudioTrackInfo(raw.track) : null,
  };
}

function toPlayerLesson(raw: RawEnrolledPlayerLesson): PlayerLesson {
  return {
    lessonId: raw.lessonId,
    lessonTitle: raw.lessonTitle,
    courseId: raw.courseId,
    courseTitle: raw.courseTitle,
    courseSlug: raw.courseSlug,
    videoSource: raw.videoSource,
    videoUrl: raw.videoUrl,
    youtubeId: raw.youtubeId,
    durationSec: raw.durationSec,
    sourceLanguage: raw.sourceLanguage,
    isPreview: raw.isPreview,
    lastPositionSec: raw.lastPositionSec,
    languages: raw.languages.map(toDubLanguage),
    // Không dùng field này nữa ở luồng đã đăng nhập — track được lấy từ `languages[].track`
    // (xem `learn/[lessonId]/page.tsx`). Giữ lại vì `PlayerLesson` dùng chung với UC11.
    activeTrack: null,
  };
}

export const lessonPlayerApi = {
  /** UC16/17 — học viên ĐÃ đăng nhập (đã ghi danh, hoặc bài Preview). Khác UC11 (ẩn danh). */
  getForPlayback: async (lessonId: number): Promise<PlayerLesson> => {
    const raw = await api.get<RawEnrolledPlayerLesson>(`/api/v1/lessons/${lessonId}/player`, {
      token: getAccessToken() ?? undefined,
    });
    return toPlayerLesson(raw);
  },
};
