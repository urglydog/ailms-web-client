import Link from 'next/link';
import { CourseCard } from '@/components/course/CourseCard';
import { publicCoursesApi, EMPTY_FILTERS } from '@/lib/api/publicCourses';

const CATEGORY_PILLS = [
  { label: 'Lập trình Web' },
  { label: 'Data Science' },
  { label: 'Mobile App' },
  { label: 'DevOps' },
  { label: 'UI/UX Design' }
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Chọn khoá học quốc tế',
    desc: 'Hàng ngàn khoá học từ các chuyên gia hàng đầu thế giới, không giới hạn bởi rào cản ngôn ngữ gốc.',
  },
  {
    num: '02',
    title: 'Kích hoạt lồng tiếng AI',
    desc: 'AI tự động dịch, tạo giọng đọc tự nhiên và đồng bộ mốc thời gian hoàn hảo với video gốc.',
  },
  {
    num: '03',
    title: 'Học cùng Socratic Tutor',
    desc: 'Không chỉ là xem video. Trợ lý ảo AI sẽ gợi mở kiến thức, giải đáp thắc mắc theo ngữ cảnh bài học.',
  },
];

export default async function HomePage() {
  const courses = await publicCoursesApi.search(EMPTY_FILTERS, 'rating', 6);

  return (
    <>
      {/* ── Hero chia đôi ── */}
      <section className="mx-auto w-full max-w-7xl px-8 pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-[22px]">
            <h1 className="m-0 font-display text-[44px] font-bold leading-[1.18] tracking-[-0.01em] text-gray-900">
              Học lập trình từ giảng viên quốc tế, nghe bằng ngôn ngữ của bạn
            </h1>
            <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.6] text-gray-500">
              AI tự động lồng tiếng bài giảng nước ngoài sang tiếng Việt, đồng bộ với hình ảnh gốc — không cần đọc phụ đề.
            </p>
            <div className="flex items-center gap-[18px]">
              <Link
                href="/courses"
                className="cursor-pointer whitespace-nowrap rounded-full bg-cyan-600 px-[26px] py-[14px] text-[15px] font-bold text-white no-underline hover:bg-cyan-700"
              >
                Khám phá khóa học
              </Link>
              <Link
                href="#demo"
                className="cursor-pointer whitespace-nowrap text-[14.5px] font-semibold text-cyan-700 no-underline hover:text-cyan-800"
              >
                Xem demo lồng tiếng AI →
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="mr-0.5 text-[13px] text-gray-400">Danh mục:</span>
              {CATEGORY_PILLS.map((cat, idx) => (
                <Link
                  key={idx}
                  href={`/courses?category=${cat.label}`}
                  className="cursor-pointer rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-gray-900 no-underline hover:bg-gray-50"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-[radial-gradient(circle_at_70%_30%,rgba(34,211,238,0.28),transparent_60%)] blur-[6px]"></div>
            <div className="relative rounded-[20px] border border-gray-200 bg-white p-4 shadow-[0_20px_50px_rgba(19,22,32,0.12)]">
              <div 
                className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[14px] bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_14px,#0891B2_14px,#0891B2_28px)]"
              >
                <div className="ml-1.5 h-0 w-0 border-y-[11px] border-l-[19px] border-y-transparent border-l-white/90"></div>
                <span className="absolute bottom-2.5 left-3 rounded-full bg-gray-900/35 px-2.5 py-1 font-mono text-[11px] text-white/85">
                  video bài giảng gốc
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4 pb-1">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5">
                  <span className="text-[13px] text-gray-500">🔇 Audio gốc (tiếng Anh)</span>
                  <span className="text-[11px] font-bold text-gray-400">TẮT</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-cyan-600/35 bg-[linear-gradient(90deg,rgba(34,211,238,0.14),rgba(8,145,178,0.14))] px-3.5 py-2.5">
                  <span className="text-[13px] font-semibold text-cyan-700">🔊 Lồng tiếng AI · Tiếng Việt</span>
                  <span className="h-2 w-2 animate-ai-pulse rounded-full bg-cyan-600"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Khoá học nổi bật ── */}
      <section className="mx-auto w-full max-w-7xl px-8 pb-2 pt-24">
        <div className="mb-8 flex flex-col gap-1.5">
          <h2 className="m-0 font-display text-[26px] font-bold text-gray-900">Khóa học nổi bật</h2>
          <p className="m-0 text-[14.5px] text-gray-500">Mỗi khóa học đều hỗ trợ lồng tiếng AI đa ngôn ngữ.</p>
        </div>

        <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* ── Quy trình 3 bước ── */}
      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-8 py-24">
        <div className="relative grid gap-9 overflow-hidden rounded-[24px] bg-[#0F1B2B] px-12 py-14 md:grid-cols-3">
          <div className="absolute -right-[60px] -top-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.25),transparent_70%)]"></div>
          {HOW_IT_WORKS.map((item) => (
            <div key={item.num} className="relative flex flex-col gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/15 font-display text-base font-bold text-cyan-300">
                {item.num}
              </span>
              <h3 className="m-0 font-display text-[17px] font-semibold text-white">{item.title}</h3>
              <p className="m-0 text-sm leading-[1.55] text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
