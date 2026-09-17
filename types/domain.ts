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
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
/** PARTIAL = đã có chunk phát được nhưng chưa ghép final.mp3 (BR-CHUNK-05) */
export type TrackStatus = 'PROCESSING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
export type MaterialType = 'MINDMAP' | 'FLASHCARD' | 'QUIZ';
export type ScopeType = 'WHOLE_COURSE' | 'CHAPTER' | 'COMPLETED_LESSONS';
export type GenStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type QuantityLevel = 'FEWER' | 'STANDARD' | 'MORE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
/** Mã giảm giá (15/09/2026, mở rộng ngoài đặc tả gốc — UC55/UC56/UC57). */
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CouponScopeType = 'ALL_COURSES' | 'SPECIFIC_COURSES' | 'SINGLE_COURSE';
export type LessonStatus = 'DRAFT' | 'READY' | 'UNAVAILABLE';

// ── Người dùng ──────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  role: Role;
  authProvider: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** "View public profile" (14/09/2026, mở rộng) — 2 công tắc tách riêng, mặc định công khai. */
  coursesPublic: boolean;
  wishlistPublic: boolean;
}

/** 1 khóa trên "View public profile" — đủ dữ liệu render thẻ card kiểu Udemy. */
export interface PublicCourseSummary {
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  isFree: boolean;
  avgRating: number;
  reviewCount: number;
}

/**
 * "View public profile" (14/09/2026, mở rộng ngoài đặc tả gốc) — `courses`/`wishlist` là
 * `null` (KHÔNG PHẢI mảng rỗng) khi chủ tài khoản đã ẩn mục đó — phân biệt "ẩn" với "công
 * khai nhưng chưa có gì".
 */
export interface PublicProfile {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  role: Role;
  memberSince: string;
  courses: PublicCourseSummary[] | null;
  wishlist: PublicCourseSummary[] | null;
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
  /** Phụ đề đã dịch sang ngôn ngữ này — rỗng nếu ngôn ngữ này chưa lồng tiếng xong. */
  subtitles: SubtitleSegment[];
}

/** Một câu phụ đề kèm mốc thời gian chính xác tới mili-giây (khớp `TranscriptSegment` phía BE). */
export interface SubtitleSegment {
  seq: number;
  startSec: number;
  endSec: number;
  text: string;
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
  /** UC09 mở rộng (14/09/2026) — tổng giây video, dùng cho bộ lọc "Thời lượng video" kiểu Udemy. */
  totalDurationSec: number;
  categorySlug: string;
  langs: DubLanguage[];
  /** Dùng cho ảnh bìa gradient khi chưa có thumbnail thật */
  coverColorA: string;
  coverColorB: string;
  /** Mã giảm giá (15/09/2026, mở rộng) — chỉ xét coupon `autoApply=true` (BR-COUPON-04), luôn
   * bằng `price` nếu không có coupon nào áp dụng hoặc khóa MIỄN PHÍ. */
  finalPrice: number;
  /** null nếu không có coupon nào áp dụng. */
  discountPercent: number | null;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  status: CourseStatus;
  chapters: Chapter[];
  /** true khi người dùng hiện tại đã sở hữu khoá học (BR-ENROLL-01) */
  enrolled: boolean;
  /** UC10 mở rộng (14/09/2026) — vùng "hero" nền đen kiểu Udemy ở trang chi tiết khóa. */
  updatedAt: string;
  /** Nhãn hiển thị (vd "Tiếng Anh"), null nếu chưa bài nào có transcript. */
  sourceLanguage: string | null;
  /** Ngôn ngữ đã lồng tiếng XONG (ít nhất 1 bài) — rỗng nếu chưa có. */
  dubbedLanguages: string[];
  learnerCount: number;
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
  /** UC09 mở rộng (14/09/2026) — bộ lọc "Ratings" kiểu Udemy: sao trung bình >= giá trị này. */
  minRating: number | null;
  /** UC09 mở rộng (14/09/2026) — bộ lọc "Video Duration": "0-1" | "1-3" | "3-6" | "6-17" | "17+". */
  durationBucket: string | null;
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
  /**
   * Học viên có thật sự sở hữu khóa học không — KHÁC `isPreview` (bài này có phải bài học thử
   * hay không). Dùng field này để mở khoá Ghi chú/Học liệu AI/Socratic Tutor, không dùng
   * `isPreview` (một bài preview vẫn xem được đầy đủ bởi học viên đã sở hữu khóa học).
   * Luôn `false` ở luồng UC11 ẩn danh (chưa đăng nhập).
   */
  enrolled: boolean;
  /** UC21/22 — sidebar "Trong khoá học này". Rỗng ở luồng UC11 ẩn danh (chưa đăng nhập). */
  chapters: ChapterNav[];
  /** Phụ đề ngôn ngữ GỐC — rỗng nếu bài học chưa từng lồng tiếng lần nào. */
  originalSubtitles: SubtitleSegment[];
}

export interface ChapterNav {
  chapterId: number;
  chapterTitle: string;
  displayOrder: number;
  lessons: LessonNav[];
}

export interface LessonNav {
  lessonId: number;
  lessonTitle: string;
  displayOrder: number;
  durationSec: number;
  isPreview: boolean;
  isCompleted: boolean;
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

/**
 * Sự kiện tiến độ CHI TIẾT trong lúc một chunk đang xử lý dở (chưa xong hẳn) — phân biệt
 * với {@link DubbingChunkProgressEvent} bằng field `stage` (chunk chỉ COMPLETED/FAILED khi
 * `dubbing_service.py` publish KHÔNG có field này). `PREPARING`/`FINALIZING` là 2 giai đoạn
 * cấp-job (tải audio nguồn / ghép file cuối), không có `chunkIndex`; các stage còn lại luôn
 * gắn với 1 chunk cụ thể.
 */
export interface DubbingStageProgressEvent {
  jobId: number;
  lessonId: number;
  stage: 'PREPARING' | 'ASR' | 'TRANSLATE' | 'TTS' | 'UPLOADING' | 'FINALIZING';
  chunkIndex?: number;
  totalChunks?: number;
}

export interface DubbingJobFinishedEvent {
  jobId: number;
  lessonId: number;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
}

export type DubbingProgressEvent =
  | DubbingStageProgressEvent
  | DubbingChunkProgressEvent
  | DubbingJobFinishedEvent;

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

/** UC20 mở rộng — 1 giọng đọc khả dụng của 1 ngôn ngữ (nguồn: `voice_mappings` đang active). */
export interface VoiceOption {
  language: string;
  voiceName: string;
  gender: 'MALE' | 'FEMALE';
  isDefault: boolean;
}

/** UC20 — kết quả huỷ job lồng tiếng đang chạy. */
export interface DubbingCancelResult {
  status: 'CANCELLED';
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
  /** "Học ngay" — bấm vào thẳng bài học này thay vì trang chi tiết khoá. null nếu khoá chưa có bài. */
  firstLessonId: number | null;
  /** Trang "Khóa học của tôi" (giao diện kiểu Udemy) — tên giảng viên hiển thị trên thẻ card. */
  instructorName: string;
  /** Số sao (1-5) học viên TỰ chấm cho khóa; null nếu chưa đánh giá (khác `alreadyReviewed` — field này mang giá trị thật). */
  myRating: number | null;
  /** Ngày ghi danh — dùng cho sort "Recently Enrolled". */
  enrolledAt: string;
  /** Lần gần nhất xem 1 bài bất kỳ trong khóa — dùng cho sort "Recently Accessed"; null nếu chưa xem bài nào. */
  lastAccessedAt: string | null;
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

// ── F8.1: Socratic AI Tutor (UC30) ───────────────────────────────

/** UC30 mở rộng — 1 tệp học viên gửi kèm câu hỏi. `dataBase64` KHÔNG có tiền tố
 * `data:image/png;base64,` — chỉ phần dữ liệu thuần, cắt bỏ trước khi gửi (xem `filesToAttachmentReqs`). */
export interface TutorAttachmentReq {
  fileName: string;
  dataBase64: string;
}

export interface TutorAskReq {
  question: string;
  /** Bỏ trống ở tin đầu tiên — BE tự tạo hoặc tái sử dụng phiên gần nhất. */
  sessionId?: number | null;
  /** UC30 mở rộng (06/09/2026) — bài học học viên ĐANG MỞ lúc hỏi, dùng làm ngữ cảnh MẶC ĐỊNH
   * (không nói rõ bài nào thì trả lời theo bài này; nói rõ 1 bài KHÁC trong khóa thì AI tự đổi). */
  currentLessonId: number;
  attachments?: TutorAttachmentReq[];
}

export interface TutorAskRes {
  sessionId: number;
  answer: string;
  /** Giây, BR-TUTOR-02 — luôn có ≥1 phần tử khi câu trả lời liên quan bài giảng. */
  citedTimestamps: number[];
  tokenUsed: number | null;
  /** Bài học THẬT SỰ được dùng làm ngữ cảnh — có thể khác `currentLessonId` đã gửi lên nếu học
   * viên hỏi rõ về 1 bài khác. Dùng để biết `citedTimestamps` thuộc video bài học nào. */
  contextLessonId: number;
}

/** UC30 mở rộng — tệp đính kèm khi hiển thị (vừa gửi, hoặc phục hồi từ lịch sử). `previewUrl`
 * chỉ dùng để XEM inline trong khung chat (ảnh) — không phải link tải xuống. */
export interface TutorAttachment {
  id: string;
  fileName: string;
  previewUrl: string;
  mimeType: string;
}

/** Tin nhắn hiển thị trong `TutorPanel` — id có thể là số thật (BE) hoặc `local-...` tạm
 * thời (vừa gửi, chưa có phản hồi). */
export interface TutorMessage {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  citedTimestamps: number[];
  attachments: TutorAttachment[];
  /** UC30 mở rộng (06/09/2026) — bài học `citedTimestamps` thực sự thuộc về, null ở tin nhắn
   * USER. Có thể khác bài học đang mở nếu học viên hỏi rõ về 1 bài khác trong khóa — click vào
   * mốc thời gian phải điều hướng đúng bài này thay vì tua nhầm video đang mở. */
  contextLessonId: number | null;
}

/** UC30 mở rộng — 1 dòng trong danh sách "lịch sử trò chuyện" kiểu ChatGPT. */
export interface TutorSession {
  id: number;
  /** Do học viên đổi tên, hoặc AI tự gợi ý sau lượt hỏi đầu, hoặc rút gọn câu hỏi đầu. */
  title: string;
  /** Thời điểm tin nhắn GẦN NHẤT — quyết định thứ tự trong nhóm "chưa ghim". */
  lastActivityAt: string;
  isPinned: boolean;
}

// ── F3.2: Thanh toán & Đối soát ─────────────────────────────────

export interface CreatePaymentReq {
  courseId: number;
  paymentMethod: string; // 'VNPAY' | 'MOMO'
  billingName?: string;
  billingPhone?: string;
  /** Mã giảm giá học viên tự nhập (15/09/2026, mở rộng) — bỏ trống nếu không dùng mã (coupon
   * autoApply vẫn được xét dù không nhập gì, xem BR-COUPON-01/04). */
  couponCode?: string;
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
  /** Mã giảm giá (15/09/2026, mở rộng) — null nếu giao dịch không dùng coupon nào. */
  originalAmount: number | null;
  discountAmount: number;
  couponCode: string | null;
}

/** Giỏ hàng (06/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc. Gộp
 * thanh toán nhiều khóa học tự chọn (checkbox) trong 1 lần "Proceed to Checkout". */
export interface CreateBatchPaymentReq {
  courseIds: number[];
  paymentMethod: string;
  billingName?: string;
  billingPhone?: string;
  /** BR-COUPON-05 — mỗi khóa trong giỏ tự chọn mã RIÊNG, đây chỉ là 1 mã áp dụng chung nếu
   * học viên nhập ở khung "Mã giảm giá" của trang giỏ hàng (áp mã ĐÓ cho MỌI khóa đang thanh
   * toán, mỗi khóa vẫn tự tính coupon tốt nhất — có thể một khóa lại có coupon autoApply lời
   * hơn coupon nhập tay, xem `CouponService.resolveBestPrice`). */
  couponCode?: string;
}

/** 1 dòng trong giỏ hàng — đủ dữ liệu để hiển thị trực tiếp, không cần gọi thêm API chi tiết
 * khóa học. */
export interface CartItem {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  price: number;
  addedAt: string;
  /** (14/09/2026, mở rộng) — đủ thông tin hiển thị trên mỗi dòng giỏ hàng kiểu Udemy. */
  avgRating: number;
  reviewCount: number;
  totalDurationSec: number;
  totalLessons: number;
  level: CourseLevel;
  /** Mã giảm giá (15/09/2026, mở rộng) — giỏ hàng không có khóa MIỄN PHÍ (BR-CART-01) nên luôn
   * xét coupon, không cần nhánh riêng như wishlist. */
  finalPrice: number;
  discountPercent: number | null;
}

/** Danh sách yêu thích (14/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả
 * gốc, cùng tinh thần {@link CartItem}. Khác giỏ hàng: khóa MIỄN PHÍ vẫn thêm được (`isFree`). */
export interface WishlistItem {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  instructorName: string;
  price: number;
  isFree: boolean;
  avgRating: number;
  reviewCount: number;
  addedAt: string;
  /** Mã giảm giá (15/09/2026, mở rộng) — bằng `price` cho khóa MIỄN PHÍ (không xét coupon). */
  finalPrice: number;
  discountPercent: number | null;
}

// ── Mã giảm giá (15/09/2026, mở rộng — UC55/UC56/UC57) ───────────

export interface CouponCourseRef {
  courseId: number;
  courseTitle: string;
}

export interface Coupon {
  id: number;
  /** null khi `autoApply=true` (BR-COUPON-04) — coupon tự động không cần mã. */
  code: string | null;
  autoApply: boolean;
  discountType: DiscountType;
  discountValue: number;
  scopeType: CouponScopeType;
  /** Rỗng khi `scopeType=ALL_COURSES`. */
  courses: CouponCourseRef[];
  createdByName: string;
  startAt: string;
  endAt: string;
  maxUsageCount: number | null;
  maxUsagePerUser: number | null;
  isActive: boolean;
  usageCount: number;
}

export interface CreateCouponReq {
  code?: string;
  autoApply: boolean;
  discountType: DiscountType;
  discountValue: number;
  scopeType: CouponScopeType;
  courseIds?: number[];
  startAt: string;
  endAt: string;
  maxUsageCount?: number | null;
  maxUsagePerUser?: number | null;
}

export interface UpdateCouponReq extends CreateCouponReq {
  isActive: boolean;
}

/** Xem trước giá sau khi nhập mã ở giỏ hàng/thanh toán — không tạo giao dịch nào. */
export interface CouponPreviewReq {
  courseId: number;
  code?: string;
}

export interface CouponPriceRes {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number | null;
  appliedCouponCode: string | null;
  /** false khi có nhập mã nhưng mã đó KHÔNG áp dụng được cho khóa này — luôn true nếu bỏ trống mã. */
  enteredCodeValid: boolean;
}

// ── F11.1: Live Classroom — vòng đời phiên (UC50) ────────────────

export type LiveVisibility = 'COURSE_ONLY' | 'PUBLIC';
export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';

export interface CreateLiveSessionInput {
  courseId: number;
  title: string;
  visibility: LiveVisibility;
  /** Bỏ trống thì BE tự lấy theo preferredLanguage của giảng viên (BR-LIVE-04). */
  sourceLanguage?: string;
  /** Bỏ trống nghĩa là "sẵn sàng bắt đầu bất kỳ lúc nào", không phải lỗi. */
  scheduledAt?: string;
}

export interface LiveSession {
  id: number;
  title: string;
  /** F11.9 mở rộng — `null` nghĩa là giảng viên chưa tự tải ảnh riêng, dùng `courseThumbnailUrl` thay. */
  thumbnailUrl: string | null;
  visibility: LiveVisibility;
  status: LiveSessionStatus;
  roomName: string;
  sourceLanguage: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  courseId: number;
  courseTitle: string;
  courseThumbnailUrl: string | null;
}

/** UC50 — trả về sau khi bấm "Bắt đầu Live", đủ để connect LiveKit React SDK. */
export interface LiveSessionStartRes {
  accessToken: string;
  serverUrl: string;
  roomName: string;
  identity: string;
}

// ── F11.2: Xem Live theo phân quyền (UC51) ───────────────────────

export interface LiveViewSummary {
  id: number;
  title: string;
  status: LiveSessionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
}

/** `viewerToken`/`serverUrl`/`roomName` chỉ có giá trị khi `status === 'LIVE'`. */
export interface LiveViewDetail {
  id: number;
  title: string;
  visibility: LiveVisibility;
  status: LiveSessionStatus;
  sourceLanguage: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  courseId: number;
  courseTitle: string;
  viewerToken: string | null;
  serverUrl: string | null;
  roomName: string | null;
}

/** F11.9 — 1 dòng trong trang khám phá `/live` (tab Công khai + Khóa học của tôi dùng chung shape
 * này — khác `LiveViewSummary`, vốn scoped sẵn theo 1 khóa học nên không cần lặp lại tên khóa). */
export interface LiveFeedItem {
  id: number;
  title: string;
  /** F11.9 mở rộng — BE đã tự áp dụng fallback về ảnh bìa khóa học nếu buổi live chưa có ảnh
   * riêng, FE dùng thẳng — vẫn có thể `null` nếu khóa học cũng chưa có ảnh bìa nào. */
  thumbnailUrl: string | null;
  status: LiveSessionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  courseId: number;
  courseTitle: string;
  /** Điều hướng sang `/courses/{slug}` — route khóa học dùng slug, không phải id. */
  courseSlug: string;
  instructorName: string;
  sourceLanguage: string;
}

// ── F11.3: Lồng tiếng Live thời gian thực (UC52) ─────────────────

export type LiveTrackStatus = 'ACTIVE' | 'STOPPED';

export interface LiveLanguageTrack {
  id: number;
  targetLanguage: string;
  voiceName: string;
  status: LiveTrackStatus;
  activeListenerCount: number;
  /** Tên track LiveKit thật, dạng `translated-{targetLanguage}` — dùng để subscribe đúng luồng. */
  trackName: string;
}

export interface ActivateLiveLanguageTrackInput {
  targetLanguage: string;
  /** Chỉ có tác dụng khi đây là ngôn ngữ CHƯA có track ACTIVE nào (BR-LIVE-05). */
  voiceName?: string;
}
