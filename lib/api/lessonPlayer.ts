import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type {
  AudioChunkInfo,
  AudioTrackInfo,
  ChapterNav,
  DubLanguage,
  LessonNav,
  PlayerLesson,
  SubtitleSegment,
  TrackStatus,
} from '@/types/domain';

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

interface RawSubtitleSegment {
  seq: number;
  startSec: number;
  endSec: number;
  text: string;
}

interface RawLanguage {
  code: string;
  label: string;
  available: boolean;
  track: RawAudioTrack | null;
  subtitles: RawSubtitleSegment[];
}

interface RawLessonNav {
  lessonId: number;
  lessonTitle: string;
  displayOrder: number;
  durationSec: number;
  isPreview: boolean;
  isCompleted: boolean;
}

interface RawChapterNav {
  chapterId: number;
  chapterTitle: string;
  displayOrder: number;
  lessons: RawLessonNav[];
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
  enrolled: boolean;
  lastPositionSec: number;
  languages: RawLanguage[];
  chapters: RawChapterNav[];
  originalSubtitles: RawSubtitleSegment[];
}

function toSubtitleSegment(raw: RawSubtitleSegment): SubtitleSegment {
  return { seq: raw.seq, startSec: raw.startSec, endSec: raw.endSec, text: raw.text };
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
    subtitles: raw.subtitles.map(toSubtitleSegment),
  };
}

function toLessonNav(raw: RawLessonNav): LessonNav {
  return {
    lessonId: raw.lessonId,
    lessonTitle: raw.lessonTitle,
    displayOrder: raw.displayOrder,
    durationSec: raw.durationSec,
    isPreview: raw.isPreview,
    isCompleted: raw.isCompleted,
  };
}

function toChapterNav(raw: RawChapterNav): ChapterNav {
  return {
    chapterId: raw.chapterId,
    chapterTitle: raw.chapterTitle,
    displayOrder: raw.displayOrder,
    lessons: raw.lessons.map(toLessonNav),
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
    enrolled: raw.enrolled,
    lastPositionSec: raw.lastPositionSec,
    languages: raw.languages.map(toDubLanguage),
    chapters: raw.chapters.map(toChapterNav),
    originalSubtitles: raw.originalSubtitles.map(toSubtitleSegment),
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
