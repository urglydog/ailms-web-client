import Link from 'next/link';
import { CourseCard } from '@/components/course/CourseCard';
import { Pill } from '@/components/ui/Pill';
import { getFeaturedCourses, MOCK_CATEGORIES } from '@/lib/mock/courses';

/**
 * Trang chủ — dịch từ nhánh `isHome` của `LinguaLearn.dc.html`.
 *
 * Là Server Component: dữ liệu khoá học nổi bật fetch trực tiếp phía server, không
 * cần React Query (theo `lms-frontend-rules` mục 5). Giai đoạn 2 chỉ cần thay
 * `getFeaturedCourses()` bằng lời gọi `api.get()` là xong.
 *
 * Bố cục theo design: hero **chia đôi** (không căn giữa), dải danh mục, lưới thẻ
 * khoá học, quy trình 3 bước — bốn nhóm section khác nhau về hình thái để trang
 * không bị đơn điệu.
 */

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Chọn khoá học bất kể ngôn ngữ gốc',
    desc: 'Kho khoá học quốc tế mở sẵn. Bạn không cần biết trước tiếng của giảng viên.',
  },
  {
    step: '02',
    title: 'Kích hoạt lồng tiếng AI',
    desc: 'Hệ thống bóc lời thoại, dịch theo ngữ cảnh và tổng hợp giọng đọc khớp mốc thời gian gốc.',
  },
  {
    step: '03',
    title: 'Học chủ động cùng Socratic AI Tutor',
    desc: 'Trợ lý không đưa đáp án sẵn mà gợi mở, kèm mốc thời gian nhấp được để bạn xem lại.',
  },
];

export default function HomePage() {
  const courses = getFeaturedCourses();

  return (
    <>
      {/* ── Hero chia đôi ── */}
      <section className="border-b border-line bg-surface-raised">
        <div className="shell grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6">
            <span className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-accent">
              <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent" aria-hidden />
              LỒNG TIẾNG AI ĐA NGÔN NGỮ
            </span>

            <h1 className="font-display text-4xl font-extrabold leading-tight text-ink md:text-5xl">
              Học không giới hạn
              <br />
              bởi ngôn ngữ
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-ink-muted">
              Chọn bất kỳ khoá học quốc tế và nghe bằng tiếng của bạn. Hệ thống tự lồng tiếng theo ngữ
              cảnh, giữ đúng mốc thời gian bài giảng, kèm trợ lý học tập gợi mở.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="rounded-full bg-accent px-6 py-3 font-display text-base font-semibold
                           text-white no-underline hover:bg-accent-dark hover:no-underline"
              >
                Khám phá khoá học
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-full border border-line px-6 py-3 font-display text-base
                           font-semibold text-ink no-underline hover:border-accent hover:text-accent
                           hover:no-underline"
              >
                Cách hoạt động
              </Link>
            </div>
          </div>

          {/* Khối minh hoạ: 5 ngôn ngữ đang được xử lý */}
          <div className="card flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-ink-faint">
              BÀI GIẢNG · 5 NGÔN NGỮ
            </span>
            {[
              { flag: '🇻🇳', label: 'Tiếng Việt', state: 'done' },
              { flag: '🇺🇸', label: 'English', state: 'done' },
              { flag: '🇯🇵', label: '日本語', state: 'active' },
              { flag: '🇰🇷', label: '한국어', state: 'idle' },
              { flag: '🇨🇳', label: '中文', state: 'idle' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                  <span aria-hidden className="text-lg">
                    {row.flag}
                  </span>
                  {row.label}
                </span>
                {row.state === 'done' && <span className="text-sm text-success">✓ Sẵn sàng</span>}
                {row.state === 'active' && (
                  <span className="flex items-center gap-1.5 text-sm text-accent">
                    <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent" aria-hidden />
                    Đang xử lý
                  </span>
                )}
                {row.state === 'idle' && <span className="text-sm text-ink-faint">Chưa tạo</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dải danh mục ── */}
      <section className="shell py-12">
        <div className="flex flex-wrap gap-2.5">
          {MOCK_CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/courses?category=${cat.slug}`} className="no-underline hover:no-underline">
              <Pill>{cat.name}</Pill>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Khoá học nổi bật ── */}
      <section className="shell pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">Khoá học nổi bật</h2>
          <Link href="/courses" className="text-sm font-semibold no-underline">
            Xem tất cả →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* ── Quy trình 3 bước ── */}
      <section id="how-it-works" className="border-t border-line bg-surface-raised py-16">
        <div className="shell">
          <h2 className="mb-10 font-display text-2xl font-bold text-ink">Cách hoạt động</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <span className="font-mono text-sm font-semibold text-accent">{item.step}</span>
                <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
