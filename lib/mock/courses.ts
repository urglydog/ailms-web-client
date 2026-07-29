/**
 * Dữ liệu giả cho Giai đoạn 0.
 *
 * Mục đích: dựng được toàn bộ UI trước khi backend có endpoint. Các giai đoạn sau
 * **chỉ cần thay hàm trong file này bằng React Query gọi API thật**, không phải sửa
 * component nào — đó là lý do mock nằm riêng ở đây chứ không rải trong page.
 *
 * Lộ trình thay thế:
 *  - Giai đoạn 2 → `getFeaturedCourses`, `getCourses`, `getCourseBySlug`
 *  - Giai đoạn 5 → `getPlayerLesson` (AudioTrack thật)
 *  - Giai đoạn 6 → tiến độ học tập
 */

import type {
  Category,
  CourseDetail,
  CourseReview,
  CourseSummary,
  DubLanguage,
  PlayerLesson,
} from '@/types/domain';

/** 5 ngôn ngữ khớp seed `voice_mappings` của backend (BR-DUB-07). */
export const MOCK_LANGUAGES: DubLanguage[] = [
  { code: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳', available: true },
  { code: 'en-US', label: 'English', flag: '🇺🇸', available: true },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵', available: false },
  { code: 'ko-KR', label: '한국어', flag: '🇰🇷', available: false },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳', available: false },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' },
  { id: 2, name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' },
  { id: 3, name: 'Trí tuệ nhân tạo', slug: 'tri-tue-nhan-tao' },
  { id: 4, name: 'Thiết kế UI/UX', slug: 'thiet-ke-ui-ux' },
  { id: 5, name: 'Ngoại ngữ chuyên ngành', slug: 'ngoai-ngu-chuyen-nganh' },
];

const COVER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#0891B2', '#0E7490'],
  ['#7C3AED', '#5B21B6'],
  ['#16A34A', '#15803D'],
  ['#EA580C', '#C2410C'],
  ['#DB2777', '#9D174D'],
  ['#0284C7', '#075985'],
];

function cover(index: number): readonly [string, string] {
  return COVER_PAIRS[index % COVER_PAIRS.length] ?? (['#0891B2', '#0E7490'] as const);
}

interface Seed {
  title: string;
  instructor: string;
  price: number;
  level: CourseSummary['level'];
  rating: number;
  reviews: number;
  lessons: number;
  category: string;
  availableLangs: number;
}

const SEEDS: Seed[] = [
  { title: 'Machine Learning với Python từ số 0', instructor: 'Trần Thanh Hà', price: 999000, level: 'ADVANCED', rating: 4.8, reviews: 120, lessons: 18, category: 'tri-tue-nhan-tao', availableLangs: 3 },
  { title: 'Next.js 15 và React Server Components', instructor: 'Nguyễn Chí Thiện', price: 0, level: 'INTERMEDIATE', rating: 4.9, reviews: 214, lessons: 22, category: 'lap-trinh-web', availableLangs: 2 },
  { title: 'Phân tích dữ liệu với Pandas', instructor: 'Lê Minh Quân', price: 599000, level: 'BEGINNER', rating: 4.6, reviews: 87, lessons: 15, category: 'khoa-hoc-du-lieu', availableLangs: 2 },
  { title: 'Thiết kế hệ thống Design System', instructor: 'Phạm Thu Trang', price: 750000, level: 'INTERMEDIATE', rating: 4.7, reviews: 64, lessons: 12, category: 'thiet-ke-ui-ux', availableLangs: 1 },
  { title: 'Spring Boot 3 cho hệ thống thực tế', instructor: 'Nguyễn Hữu Sang', price: 0, level: 'ADVANCED', rating: 4.9, reviews: 176, lessons: 26, category: 'lap-trinh-web', availableLangs: 4 },
  { title: 'Tiếng Anh cho lập trình viên', instructor: 'Đỗ Khánh Linh', price: 450000, level: 'BEGINNER', rating: 4.5, reviews: 302, lessons: 20, category: 'ngoai-ngu-chuyen-nganh', availableLangs: 2 },
];

function toSummary(seed: Seed, index: number): CourseSummary {
  const [a, b] = cover(index);
  return {
    id: index + 1,
    title: seed.title,
    slug: `khoa-hoc-${index + 1}`,
    instructorName: seed.instructor,
    thumbnailUrl: null,
    level: seed.level,
    price: seed.price,
    isFree: seed.price === 0,
    avgRating: seed.rating,
    reviewCount: seed.reviews,
    totalLessons: seed.lessons,
    categorySlug: seed.category,
    langs: MOCK_LANGUAGES.slice(0, seed.availableLangs).map((l) => ({ ...l, available: true })),
    coverColorA: a,
    coverColorB: b,
  };
}

export const MOCK_COURSES: CourseSummary[] = SEEDS.map(toSummary);

export function getFeaturedCourses(): CourseSummary[] {
  return MOCK_COURSES;
}

export interface CourseFilterState {
  category: string | null;
  level: string | null;
  priceType: 'all' | 'free' | 'paid';
  lang: string | null;
  keyword: string;
}

export const EMPTY_FILTERS: CourseFilterState = {
  category: null,
  level: null,
  priceType: 'all',
  lang: null,
  keyword: '',
};

/** Lọc phía client cho mock. Giai đoạn 2 sẽ đổi thành query param gửi lên backend (UC09). */
export function filterCourses(courses: CourseSummary[], f: CourseFilterState): CourseSummary[] {
  return courses.filter((c) => {
    if (f.category && c.categorySlug !== f.category) return false;
    if (f.level && c.level !== f.level) return false;
    if (f.priceType === 'free' && !c.isFree) return false;
    if (f.priceType === 'paid' && c.isFree) return false;
    if (f.lang && !c.langs.some((l) => l.code === f.lang)) return false;
    if (f.keyword.trim()) {
      const kw = f.keyword.trim().toLowerCase();
      const hay = `${c.title} ${c.instructorName}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}

export function getCourseBySlug(slug: string): CourseDetail | null {
  const base = MOCK_COURSES.find((c) => c.slug === slug);
  if (!base) return null;

  return {
    ...base,
    description:
      'Khoá học đi từ nền tảng tới ứng dụng thực tế, mỗi bài giảng đều có bản lồng tiếng AI đa ngôn ngữ và trợ lý Socratic AI Tutor đồng hành. Bạn có thể tạo Sơ đồ tư duy, Thẻ ghi nhớ và bài Quiz theo phạm vi mình chọn.',
    status: 'PUBLISHED',
    enrolled: false,
    chapters: [
      {
        id: 1,
        title: 'Chương 1 — Nhập môn và thiết lập môi trường',
        displayOrder: 1,
        lessons: [
          { id: 101, title: 'Giới thiệu khoá học', durationSec: 480, displayOrder: 1, isPreview: true, status: 'READY' },
          { id: 102, title: 'Cài đặt công cụ cần thiết', durationSec: 720, displayOrder: 2, isPreview: true, status: 'READY' },
          { id: 103, title: 'Cấu trúc dự án mẫu', durationSec: 900, displayOrder: 3, isPreview: false, status: 'READY' },
        ],
      },
      {
        id: 2,
        title: 'Chương 2 — Kiến thức cốt lõi',
        displayOrder: 2,
        lessons: [
          { id: 201, title: 'Các khái niệm nền tảng', durationSec: 1500, displayOrder: 1, isPreview: false, status: 'READY' },
          { id: 202, title: 'Thực hành bài tập đầu tiên', durationSec: 1800, displayOrder: 2, isPreview: false, status: 'READY' },
        ],
      },
      {
        id: 3,
        title: 'Chương 3 — Ứng dụng thực tế',
        displayOrder: 3,
        lessons: [
          { id: 301, title: 'Xây dựng tính năng hoàn chỉnh', durationSec: 2400, displayOrder: 1, isPreview: false, status: 'READY' },
          { id: 302, title: 'Kiểm thử và tối ưu', durationSec: 1620, displayOrder: 2, isPreview: false, status: 'READY' },
        ],
      },
    ],
  };
}

export function getCourseReviews(): CourseReview[] {
  return [
    { id: 1, userName: 'Hoàng Anh', userAvatarUrl: null, rating: 5, comment: 'Phần lồng tiếng AI rất tự nhiên, mình học bằng tiếng Việt mà nội dung gốc là tiếng Anh nên tiếp thu nhanh hơn nhiều.', createdAt: '2026-07-20T10:00:00' },
    { id: 2, userName: 'Minh Thư', userAvatarUrl: null, rating: 4, comment: 'Trợ lý Socratic hỏi lại thay vì cho đáp án luôn, hơi mất thời gian nhưng hiểu sâu hơn thật.', createdAt: '2026-07-18T14:30:00' },
    { id: 3, userName: 'Quốc Bảo', userAvatarUrl: null, rating: 5, comment: 'Thẻ ghi nhớ tự sinh theo chương mình đã học xong, tiện hơn tự làm.', createdAt: '2026-07-15T09:15:00' },
  ];
}

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
