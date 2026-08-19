import { api } from '@/lib/api/client';
import type {
  Chapter,
  CourseDetail,
  CourseFilterState,
  CourseSortBy,
  CourseSummary,
  Page,
  PlayerLesson,
} from '@/types/domain';

export const EMPTY_FILTERS: CourseFilterState = {
  category: null,
  level: null,
  priceType: 'all',
  keyword: '',
};

/** Cùng bảng màu placeholder ảnh bìa đã dùng ở `lib/mock/courses.ts` — giữ nhất quán hình ảnh. */
const COVER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#0891B2', '#0E7490'],
  ['#7C3AED', '#5B21B6'],
  ['#16A34A', '#15803D'],
  ['#EA580C', '#C2410C'],
  ['#DB2777', '#9D174D'],
  ['#0284C7', '#075985'],
];

function coverColors(id: number): readonly [string, string] {
  return COVER_PAIRS[id % COVER_PAIRS.length] ?? COVER_PAIRS[0]!;
}

interface RawSummary {
  id: number;
  title: string;
  slug: string;
  instructorName: string;
  thumbnailUrl: string | null;
  level: CourseSummary['level'];
  price: number;
  isFree: boolean;
  avgRating: number;
  reviewCount: number;
  totalLessons: number;
  categorySlug: string;
  categoryName: string;
}

interface RawLesson {
  id: number;
  title: string;
  displayOrder: number;
  isPreview: boolean;
  durationSec: number;
}

interface RawChapter {
  id: number;
  title: string;
  displayOrder: number;
  lessons: RawLesson[];
}

interface RawDetail extends RawSummary {
  description: string | null;
  chapters: RawChapter[];
}

/**
 * `coverColorA/B` và `langs` không đến từ backend — đó là màu trang trí khi chưa có ảnh bìa thật
 * (suy tất định từ `id`) và dữ liệu lồng tiếng (chưa có ở Giai đoạn này). Adapter này khớp đúng
 * type `CourseSummary` để `CourseCard.tsx` dùng được ngay, không cần sửa component.
 */
function toSummary(raw: RawSummary): CourseSummary {
  const [coverColorA, coverColorB] = coverColors(raw.id);
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    instructorName: raw.instructorName,
    thumbnailUrl: raw.thumbnailUrl,
    level: raw.level,
    price: raw.price,
    isFree: raw.isFree,
    avgRating: raw.avgRating,
    reviewCount: raw.reviewCount,
    totalLessons: raw.totalLessons,
    categorySlug: raw.categorySlug,
    langs: [],
    coverColorA,
    coverColorB,
  };
}

function toChapters(raw: RawChapter[]): Chapter[] {
  return raw.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    displayOrder: chapter.displayOrder,
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationSec: lesson.durationSec,
      displayOrder: lesson.displayOrder,
      isPreview: lesson.isPreview,
      // Trạng thái video (DRAFT/READY/UNAVAILABLE) là dữ liệu tác nghiệp phía Giảng viên,
      // không có ở API công khai — không component nào ở trang công khai đọc field này.
      status: 'READY',
    })),
  }));
}

function toDetail(raw: RawDetail): CourseDetail {
  return {
    ...toSummary(raw),
    description: raw.description ?? '',
    // Endpoint chỉ trả khóa PUBLISHED (404 với mọi trạng thái khác) nên luôn đúng ở đây.
    status: 'PUBLISHED',
    chapters: toChapters(raw.chapters),
    // Chưa có luồng ghi danh/mua khóa thật (Giai đoạn 3) nên luôn coi là chưa sở hữu.
    enrolled: false,
  };
}

interface RawPlayerLesson {
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  videoSource: 'UPLOAD' | 'YOUTUBE';
  videoUrl: string;
  youtubeId: string | null;
  durationSec: number;
  isPreview?: boolean;
}

/** Lồng tiếng (`voice_mappings`) và tiến độ xem dở chưa có API — Giai đoạn 5/6. */
function toPlayerLesson(raw: RawPlayerLesson): PlayerLesson {
  return {
    lessonId: raw.lessonId,
    lessonTitle: raw.lessonTitle,
    courseId: raw.courseId,
    courseTitle: raw.courseTitle,
    courseSlug: raw.courseSlug,
    isPreview: raw.isPreview || false,
    videoSource: raw.videoSource,
    videoUrl: raw.videoUrl,
    youtubeId: raw.youtubeId,
    durationSec: raw.durationSec,
    sourceLanguage: null,
    languages: [],
    activeTrack: null,
    lastPositionSec: 0,
    // Chưa đăng nhập (UC11) — khách chưa từng sở hữu khoá nào, không có sidebar chương/bài +
    // tiến độ, xem `useEnrolledLessonPlayer`.
    enrolled: false,
    chapters: [],
    // UC11 ẩn danh chưa có API phụ đề (chỉ endpoint UC16/17 đã đăng nhập mới trả) — rỗng an toàn.
    originalSubtitles: [],
  };
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const publicCoursesApi = {
  search: async (filters: CourseFilterState, sortBy: CourseSortBy = 'newest', size = 24): Promise<CourseSummary[]> => {
    const query = buildQuery({
      keyword: filters.keyword || undefined,
      categorySlug: filters.category ?? undefined,
      level: filters.level ?? undefined,
      priceType: filters.priceType === 'all' ? undefined : filters.priceType,
      sortBy: sortBy === 'newest' ? undefined : sortBy,
      size,
    });
    const page = await api.get<Page<RawSummary>>(`/api/v1/courses${query}`);
    return page.content.map(toSummary);
  },

  getBySlug: async (slug: string): Promise<CourseDetail> => {
    const raw = await api.get<RawDetail>(`/api/v1/courses/${slug}`);
    return toDetail(raw);
  },

  /** UC11 — Học thử Preview: chỉ trả về được nếu bài học đánh dấu Preview (BR-ENROLL-02). */
  getLessonPlayer: async (lessonId: number): Promise<PlayerLesson> => {
    const raw = await api.get<RawPlayerLesson>(`/api/v1/courses/lessons/${lessonId}/player`);
    return toPlayerLesson(raw);
  },
};
