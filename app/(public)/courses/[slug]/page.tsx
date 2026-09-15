import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterAccordion } from '@/components/course/ChapterAccordion';
import { CoursePreview } from '@/components/course/CoursePreview';
import { EnrollButton } from '@/components/course/EnrollButton';
import { ReviewsSection } from '@/components/course/ReviewsSection';
import { CourseLiveBanner } from '@/components/live/CourseLiveBanner';
import { Badge } from '@/components/ui/Badge';
import { ApiError } from '@/lib/api/client';
import { publicCoursesApi } from '@/lib/api/publicCourses';

/**
 * Chi tiết khoá học — dịch từ nhánh `isDetail` của design. UC10.
 *
 * Server Component: gọi thẳng API công khai (`publicCoursesApi.getBySlug`) phía
 * server, tốt cho SEO trang công khai. `ReviewsSection`/`CoursePreview` là Client
 * Component nhúng riêng vì cần state tương tác.
 *
 * Vùng "hero" nền đen (14/09/2026, thiết kế lại kiểu Udemy) — trước đây trang này không
 * tách hero riêng, chạy thẳng layout 2 cột nền trắng từ đầu. Giờ tách riêng 1 khối
 * `bg-ink` full-bleed (nằm NGOÀI `.shell` để chiếm hết chiều ngang, có `.shell` riêng bên
 * trong để căn nội dung) chứa tiêu đề/mô tả/tác giả/ngày cập nhật/ngôn ngữ gốc/ngôn ngữ đã
 * lồng tiếng/rating/số học viên — đúng các mục yêu cầu, không dùng `StarRating`/token
 * `ink`/`ink-muted` ở đây vì 2 token đó là màu CHỮ TỐI dành cho nền sáng, đặt trên nền đen
 * sẽ chìm mất chữ (đen trên đen).
 *
 * Giai đoạn 3 sẽ thay khối "Ghi danh" bằng luồng thật: khoá miễn phí ghi danh ngay
 * (UC12), khoá trả phí chuyển sang checkout (UC13 → UC14).
 */

const LEVEL_LABEL = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
} as const;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let course;
  try {
    course = await publicCoursesApi.getBySlug(slug);
  } catch (err) {
    // 404 khi khóa không tồn tại HOẶC chưa PUBLISHED (BR-ROLE-03) — cùng 1 xử lý,
    // không phân biệt để tránh lộ sự tồn tại của khóa DRAFT/PENDING cho Guest.
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  // Toàn bộ bài Preview theo đúng thứ tự chương-bài (không chỉ 1 bài đầu tiên như trước) —
  // dùng cho modal "Xem trước khóa học" (CoursePreview.tsx).
  const previewLessons = allLessons.filter((lesson) => lesson.isPreview);
  const firstLesson = allLessons[0] ?? null;
  const lastUpdatedLabel = new Date(course.updatedAt).toLocaleDateString('vi-VN', {
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      {/* ── Vùng hero nền đen ── */}
      <div className="bg-ink text-white">
        <div className="shell flex flex-col gap-4 py-10">
          <nav aria-label="Đường dẫn" className="text-[13px] text-white/60">
            <Link href="/courses" className="font-semibold text-white/80 no-underline hover:text-white">
              Kho khoá học
            </Link>
            <span> / </span>
            <span>{course.title}</span>
          </nav>

          <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-tight">{course.title}</h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-white/70">{course.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-star">
              {course.avgRating.toFixed(1)}
              <span aria-hidden>★</span>
              <span className="font-normal text-white/60">({course.reviewCount.toLocaleString('vi-VN')})</span>
            </span>
            <span className="text-white/60">
              {course.learnerCount.toLocaleString('vi-VN')} học viên
            </span>
            <span className="text-white/60">{LEVEL_LABEL[course.level]}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/60">
            <span>
              Giảng viên: <span className="text-white/85">{course.instructorName}</span>
            </span>
            <span aria-hidden>·</span>
            <span>Cập nhật {lastUpdatedLabel}</span>
            {course.sourceLanguage && (
              <>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
                  </svg>
                  {course.sourceLanguage}
                </span>
              </>
            )}
          </div>

          {course.dubbedLanguages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-white/70">Đã lồng tiếng:</span>
              {course.dubbedLanguages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[12.5px] text-white/85"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shell py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* ── Cột nội dung ── */}
          <div className="flex min-w-0 flex-col gap-8">
            <CourseLiveBanner courseId={course.id} />

            {/* Nội dung khoá học */}
            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">
                Nội dung khoá học
                <span className="ml-2 text-sm font-normal text-ink-muted">
                  {course.chapters.length} chương · {totalLessons} bài
                </span>
              </h2>
              <ChapterAccordion chapters={course.chapters} enrolled={course.enrolled} />
            </section>

            {/* Đánh giá (UC23) */}
            <section>
              <h2 className="mb-4 font-display text-xl font-bold text-ink">Đánh giá từ học viên</h2>
              <ReviewsSection courseId={course.id} />
            </section>
          </div>

          {/* ── Cột ghi danh (sticky) ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <CoursePreview
                thumbnailUrl={course.thumbnailUrl}
                courseTitle={course.title}
                previewLessons={previewLessons}
              />

              <div className="flex flex-col gap-4 p-6">
                {course.isFree ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-success">Miễn phí</span>
                    <Badge tone="success">Sở hữu vĩnh viễn</Badge>
                  </div>
                ) : course.discountPercent ? (
                  // Mã giảm giá (15/09/2026, mở rộng) — chỉ coupon `autoApply=true` hiện trực
                  // tiếp ở đây, không cần nhập mã (BR-COUPON-04).
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-ink">
                        {course.finalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="rounded bg-danger/10 px-2 py-0.5 text-sm font-bold text-danger">
                        -{course.discountPercent}%
                      </span>
                    </div>
                    <span className="text-sm text-ink-faint line-through">
                      {course.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-ink">
                      {course.price.toLocaleString('vi-VN')}đ
                    </span>
                    <Badge tone="neutral">Sở hữu vĩnh viễn</Badge>
                  </div>
                )}

                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isFree={course.isFree}
                  enrolled={course.enrolled}
                  firstLessonId={firstLesson?.id ?? null}
                />

                <ul className="mt-2 flex flex-col gap-2 text-sm text-ink-muted">
                  <li>✓ {totalLessons} bài giảng có lồng tiếng AI</li>
                  <li>✓ Trợ lý Socratic AI Tutor</li>
                  <li>✓ Sơ đồ tư duy, Thẻ ghi nhớ, Quiz tự sinh</li>
                  <li>✓ Truy cập vĩnh viễn sau khi sở hữu</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
