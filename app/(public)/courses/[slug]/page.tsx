import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterAccordion } from '@/components/course/ChapterAccordion';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { getCourseBySlug, getCourseReviews } from '@/lib/mock/courses';

/**
 * Chi tiết khoá học — dịch từ nhánh `isDetail` của design. UC10.
 *
 * Server Component: nội dung khoá học là dữ liệu tĩnh theo request, fetch trực tiếp
 * phía server. Chỉ accordion là Client Component vì cần state mở/đóng.
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
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const reviews = getCourseReviews();
  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const previewLesson = course.chapters
    .flatMap((ch) => ch.lessons)
    .find((lesson) => lesson.isPreview);

  return (
    <div className="shell py-10">
      {/* Breadcrumb */}
      <nav aria-label="Đường dẫn" className="mb-6 text-[13px] text-ink-faint">
        <Link href="/courses" className="font-semibold no-underline">
          Kho khoá học
        </Link>
        <span> / </span>
        <span className="text-ink-muted">{course.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* ── Cột nội dung ── */}
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="font-display text-3xl font-extrabold leading-tight text-ink">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-ink-muted">GV. {course.instructorName}</span>
              <StarRating
                rating={course.avgRating}
                reviewCount={course.reviewCount}
                levelLabel={LEVEL_LABEL[course.level]}
              />
            </div>

            <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">{course.description}</p>

            {/* Ngôn ngữ lồng tiếng đã có (BR-DUB-07) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">Lồng tiếng sẵn có:</span>
              {course.langs.map((lang) => (
                <span
                  key={lang.code}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line
                             bg-surface-raised px-2.5 py-1 text-[13px] text-ink-muted"
                >
                  <span aria-hidden>{lang.flag}</span>
                  {lang.label}
                </span>
              ))}
            </div>
          </header>

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
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <article key={review.id} className="card flex flex-col gap-2 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm font-semibold text-ink">{review.userName}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm leading-relaxed text-ink-muted">{review.comment}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* ── Cột ghi danh (sticky) ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card flex flex-col gap-4 p-6">
            {course.isFree ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-success">Miễn phí</span>
                <Badge tone="success">Sở hữu vĩnh viễn</Badge>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-ink">
                  {course.price.toLocaleString('vi-VN')}đ
                </span>
                <Badge tone="neutral">Sở hữu vĩnh viễn</Badge>
              </div>
            )}

            {/* Giai đoạn 3 sẽ nối vào UC12 (miễn phí) hoặc UC13 → UC14 (trả phí) */}
            <button
              type="button"
              className="w-full rounded-full bg-accent px-6 py-3 font-display text-base
                         font-semibold text-white hover:bg-accent-dark"
            >
              {course.isFree ? 'Đăng ký học ngay' : 'Mua khoá học'}
            </button>

            {previewLesson && (
              <Link
                href={`/learn/${previewLesson.id}`}
                className="w-full rounded-full border border-line px-6 py-3 text-center font-display
                           text-base font-semibold text-ink no-underline hover:border-accent
                           hover:text-accent hover:no-underline"
              >
                Học thử miễn phí
              </Link>
            )}

            <ul className="mt-2 flex flex-col gap-2 text-sm text-ink-muted">
              <li>✓ {totalLessons} bài giảng có lồng tiếng AI</li>
              <li>✓ Trợ lý Socratic AI Tutor</li>
              <li>✓ Sơ đồ tư duy, Thẻ ghi nhớ, Quiz tự sinh</li>
              <li>✓ Truy cập vĩnh viễn sau khi sở hữu</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
