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
  /** Track thật của ngôn ngữ này (Giai đoạn 6) — null khi chưa `available` hoặc đang PROCESSING/FAILED. */
  track?: AudioTrackInfo | null;
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
  courseId: number;
  /** Chỉ Admin cần (trang kiểm duyệt gộp review từ nhiều khóa) — trang công khai không dùng. */
  courseTitle: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  /** Admin ẩn nếu vi phạm tiêu chuẩn cộng đồng (UC44) — review ẩn không hiện ở trang công khai. */
  isHidden: boolean;
  createdAt: string;
}

/** UC09 — bộ lọc duyệt khóa học công khai. Không có field ngôn ngữ lồng tiếng: chưa có dữ liệu
 * lồng tiếng thật gắn với khóa học nào (Giai đoạn 5), bổ sung khi có dữ liệu thật. */
export interface CourseFilterState {
  category: string | null;
  level: string | null;
  priceType: 'all' | 'free' | 'paid';
  keyword: string;
}

/** Không có từ khóa thì "relevance" cư xử giống hệt "newest" (không có gì để so khớp). */
export type CourseSortBy = 'relevance' | 'rating' | 'reviews' | 'newest';

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
  isPreview: boolean;
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
  /** F5.3 — chunk này hết retry (BR-CHUNK-04), vẫn phát bằng audio gốc riêng đoạn đó. */
  failed?: boolean;
}

/**
 * F5.3 — sự kiện realtime nhận qua STOMP `/topic/dubbing/{lessonId}`
 * (`DubbingProgressSubscriber` forward nguyên văn payload Redis Pub/Sub của AI Worker).
 *
 * Có `chunkIndex` → sự kiện CẤP-CHUNK (một chunk 10 phút vừa xong/lỗi).
 * Không có `chunkIndex` → sự kiện CẤP-JOB (toàn bộ pipeline vừa kết thúc) — đây mới là tín
 * hiệu đáng tin để dừng progress bar, vì chunk cuối "COMPLETED" chưa có nghĩa là job đã xong
 * (còn phải chờ FFmpeg concat + upload B2 + gọi callback `finish_*`).
 */
export interface DubbingChunkProgressEvent {
  jobId: number;
  lessonId: number;
  chunkIndex: number;
  totalChunks: number;
  status: 'COMPLETED' | 'FAILED';
}

export interface DubbingJobFinishedEvent {
  jobId: number;
  lessonId: number;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

export type DubbingProgressEvent = DubbingChunkProgressEvent | DubbingJobFinishedEvent;

/** UC45 — 1 dòng trong bảng giám sát hàng đợi lồng tiếng của Admin. */
export interface AiJobSummary {
  id: number;
  lessonId: number;
  lessonTitle: string;
  targetLanguage: string;
  status: JobStatus;
  totalChunks: number;
  doneChunks: number;
  progressPercent: number;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
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

// ── F2.1: Tạo & kiểm duyệt khóa học (Instructor + Admin) ─────────
// Type độc lập với CourseSummary/CourseDetail phía trên — 2 nhóm type đó phục vụ
// trang duyệt công khai (F2.2), có field khác hẳn (langs, coverColorA/B, reviewCount).

export interface CreateCourseInput {
  title: string;
  description?: string;
  categoryId: number;
  level?: CourseLevel;
  price: number;
}

export interface UpdateCourseInput {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  level?: CourseLevel;
  price: number;
}

export interface RejectCourseInput {
  reason: string;
}

export interface InstructorCourseSummary {
  id: number;
  title: string;
  slug: string;
  status: CourseStatus;
  thumbnailUrl: string | null;
  categoryName: string;
  price: number;
  isFree: boolean;
  avgRating: number;
  totalLessons: number;
  createdAt: string;
}

export interface LessonEditItem {
  id: number;
  title: string;
  displayOrder: number;
  isPreview: boolean;
  status: LessonStatus;
  videoSource: 'UPLOAD' | 'YOUTUBE' | null;
  videoUrl: string | null;
  youtubeId: string | null;
  durationSec: number | null;
}

export interface ChapterEditItem {
  id: number;
  title: string;
  displayOrder: number;
  lessons: LessonEditItem[];
}

export interface CourseEditDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  status: CourseStatus;
  rejectReason: string | null;
  resubmitCount: number;
  categoryId: number;
  categoryName: string;
  instructorId: number;
  instructorName: string;
  chapters: ChapterEditItem[];
  missingConditions: string[];
  canSubmit: boolean;
}

export interface CreateChapterInput {
  title: string;
}

export interface UpdateChapterInput {
  title: string;
}

export interface CreateLessonInput {
  title: string;
}

export interface UpdateLessonInput {
  title: string;
  isPreview: boolean;
}

export interface ReorderInput {
  orderedIds: number[];
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}

// ── Giai đoạn 5: Lồng tiếng AI ───────────────────────────────────

/** UC47 — Admin cấu hình giọng đọc theo ngôn ngữ (BR-DUB-07). */
export interface VoiceMapping {
  id: number;
  language: string;
  voiceName: string;
  gender: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateVoiceMappingInput {
  language: string;
  voiceName: string;
  gender: string;
  isDefault: boolean;
}

export interface UpdateVoiceMappingInput {
  gender: string;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * UC18 — kết quả gọi kích hoạt lồng tiếng:
 * `CREATED` (job mới, subscribe WebSocket) · `PROCESSING` (job đã có, dedupe BR-DUB-05) ·
 * `AVAILABLE` (đã có audioUrl sẵn, phát luôn — BR-DUB-04).
 */
export interface DubbingActivateResult {
  status: 'CREATED' | 'PROCESSING' | 'AVAILABLE';
  jobId: number | null;
  audioUrl: string | null;
}

// ── F2.2: Khám phá công khai & Đánh giá ──────────────────────────

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

/** Giai đoạn 4 (UC34) — dán link YouTube công khai thay cho upload MP4. */
export interface SetYoutubeVideoInput {
  url: string;
}

/** Tài liệu đính kèm bài học (Giai đoạn 4, UC35) — tối đa 5 file/bài (BR-UPLOAD-01). */
export interface LessonDocumentItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

/** "Khóa học của tôi" — khóa Student đã sở hữu (đọc, chưa có luồng ghi danh/mua thật — GĐ3). */
export interface EnrolledCourse {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  categoryName: string;
  isFree: boolean;
  price: number;
  alreadyReviewed: boolean;
  /** UC22 — % bài COMPLETED / tổng bài READY (BR-PROGRESS-02). */
  progressPct: number;
  /** Chỉ có giá trị khi progressPct đạt 100. */
  completedAt: string | null;
  /** BR-PROGRESS-04 — MAX điểm Quiz mọi bộ. Luôn null ở Giai đoạn 6 (Quiz thật làm ở Giai đoạn 7). */
  quizScore: number | null;
}

// ── F6.2: Tiến độ học tập (UC21, UC22) ───────────────────────────
export interface LessonProgressRecordReq {
  watchedSec: number;
  lastPositionSec: number;
}

export interface LessonProgressRes {
  watchedSec: number;
  lastPositionSec: number;
  isCompleted: boolean;
}

// ── F3.2: Thanh toán & Đối soát ─────────────────────────────────

export interface CreatePaymentReq {
  courseId: number;
  paymentMethod: string; // 'VNPAY' | 'MOMO'
  billingName?: string;
  billingPhone?: string;
}

export interface PaymentUrlRes {
  paymentUrl: string;
}

export interface PaymentRes {
  txnRef: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  paidAt: string | null;
  courseTitle: string;
  gatewayTxnNo: string | null;
  billingName?: string;
  billingPhone?: string;
}
