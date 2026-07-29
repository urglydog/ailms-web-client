/**
 * Kiểu dữ liệu miền — khớp entity của backend.
 *
 * Nguồn sự thật: `Skills/CodeSkills/05_AIPoweredLMS/reference/entities.md`.
 * Khi backend đổi entity, sửa file này trước rồi mới sửa component.
 *
 * Quy ước: các union type dưới đây phản chiếu đúng enum Java, viết HOA giống
 * `@Enumerated(EnumType.STRING)` để so sánh trực tiếp với dữ liệu API.
 */

// ── Enum (khớp com.lms.common.enums) ────────────────────────────
export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
/** PARTIAL = đã có chunk phát được nhưng chưa ghép final.mp3 (BR-CHUNK-05) */
export type TrackStatus = 'PROCESSING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
export type MaterialType = 'MINDMAP' | 'FLASHCARD' | 'QUIZ';
export type ScopeType = 'WHOLE_COURSE' | 'CHAPTER' | 'COMPLETED_LESSONS';
export type GenStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type QuantityLevel = 'FEWER' | 'STANDARD' | 'MORE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LessonStatus = 'DRAFT' | 'READY' | 'UNAVAILABLE';

// ── Người dùng ──────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  preferredLanguage: string;
}

// ── Khoá học ────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
}

/** Ngôn ngữ lồng tiếng khả dụng, lấy từ bảng voice_mappings (BR-DUB-07). */
export interface DubLanguage {
  code: string;
  label: string;
  /** Emoji cờ, chỉ để hiển thị */
  flag: string;
  /** false = chưa có AudioTrack cho ngôn ngữ này -> hiện panel kích hoạt (UC18) */
  available: boolean;
}

export interface CourseSummary {
  id: number;
  title: string;
  slug: string;
  instructorName: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  avgRating: number;
  reviewCount: number;
  totalLessons: number;
  categorySlug: string;
  langs: DubLanguage[];
  /** Dùng cho ảnh bìa gradient khi chưa có thumbnail thật */
  coverColorA: string;
  coverColorB: string;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  status: CourseStatus;
  chapters: Chapter[];
  /** true khi người dùng hiện tại đã sở hữu khoá học (BR-ENROLL-01) */
  enrolled: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  displayOrder: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: number;
  title: string;
  durationSec: number;
  displayOrder: number;
  /** Tối đa 2 bài/khoá. Guest xem được video nhưng KHÔNG dùng AI Tutor/Quiz/Flashcards (BR-ENROLL-02) */
  isPreview: boolean;
  status: LessonStatus;
}

export interface CourseReview {
  id: number;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

// ── Dual Player (UC16, UC17) ────────────────────────────────────
export interface AudioTrackInfo {
  id: number;
  language: string;
  status: TrackStatus;
  /** Có giá trị khi đã ghép xong; null thì phải phát playlist chunks (BR-CHUNK-05) */
  finalUrl: string | null;
  durationSec: number;
  /** Dùng khi finalUrl còn null (status = PARTIAL) */
  chunks: AudioChunkInfo[];
}

export interface AudioChunkInfo {
  chunkIndex: number;
  startSec: number;
  endSec: number;
  fileUrl: string;
}

export interface PlayerLesson {
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
  /** Ngôn ngữ lồng tiếng khả dụng + trạng thái từng ngôn ngữ */
  languages: DubLanguage[];
  /** Track đang chọn; null = đang phát âm thanh gốc */
  activeTrack: AudioTrackInfo | null;
  lastPositionSec: number;
}

// ── Tiến độ lồng tiếng (UC20) ───────────────────────────────────
export interface DubbingProgress {
  jobId: number;
  status: JobStatus;
  totalChunks: number;
  doneChunks: number;
  percent: number;
  steps: PipelineStep[];
}

export interface PipelineStep {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
}

// ── Lỗi API (RFC 7807 ProblemDetail từ backend) ─────────────────
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  /** Mã lỗi ổn định của dự án, ví dụ QUOTA_EXCEEDED */
  code: string;
  timestamp: string;
  /** Chỉ có với lỗi Bean Validation */
  fieldErrors?: Record<string, string>;
}

/** Trang dữ liệu — khớp Page<T> của Spring Data. */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
