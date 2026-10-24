import { HomeHero } from '@/components/home/HomeHero';
import { HomeShelves } from '@/components/home/HomeShelves';
import { TrendingCourses } from '@/components/home/TrendingCourses';
import { RankingBanner } from '@/components/ranking/RankingBanner';
import { publicCoursesApi, EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { TRENDING_FETCH_SIZE } from '@/lib/home/trending';

/**
 * Trang chủ gọi API thật (danh sách khóa nổi bật) — không có route segment động nên
 * `next build` mặc định cố dựng tĩnh (SSG), gọi fetch này NGAY LÚC BUILD. Môi trường CI/CD
 * (GitHub Actions) không có backend đang chạy ở hostname `backend` (đó là tên service nội
 * bộ của Docker Compose) nên build sẽ lỗi `getaddrinfo EAI_AGAIN backend`. Ép render động
 * (mỗi request) để fetch chỉ chạy lúc có người dùng thật truy cập, không chạy lúc build.
 */
export const dynamic = 'force-dynamic';

/**
 * Backend tự host (VPS) thỉnh thoảng có network blip (ISP/route quốc tế) khiến fetch lúc SSR
 * timeout/fail. Không bọc try/catch thì 1 trong 4 API lỗi là Promise.all reject, kéo sập TOÀN BỘ
 * trang chủ với "Application error: a server-side exception has occurred" (đã xảy ra thật
 * 24/10/2026, digest 3227098399) — dù 3 API còn lại vẫn gọi được bình thường. Bắt lỗi riêng từng
 * API để API nào lỗi thì mục đó rỗng, không ảnh hưởng các mục khác.
 */
async function safeSearch(...args: Parameters<typeof publicCoursesApi.search>) {
  try {
    return await publicCoursesApi.search(...args);
  } catch {
    return [];
  }
}

/** Trang chủ (spec mục 4): hero chia đôi, rồi "Đang thịnh hành" và các hàng Mới ra mắt / Miễn phí / Người mới / Chủ đề. Banner xếp hạng cộng đồng (có sẵn)
 * đặt cuối để không tranh chú ý với hero. */
export default async function HomePage() {
  const [courses, newest, free, beginner] = await Promise.all([
    safeSearch(EMPTY_FILTERS, 'rating', TRENDING_FETCH_SIZE),
    safeSearch(EMPTY_FILTERS, 'newest', TRENDING_FETCH_SIZE),
    safeSearch({ ...EMPTY_FILTERS, priceType: 'free' }, 'reviews', TRENDING_FETCH_SIZE),
    safeSearch({ ...EMPTY_FILTERS, level: 'BEGINNER', priceType: 'paid' }, 'rating', TRENDING_FETCH_SIZE),
  ]);

  return (
    <>
      <HomeHero />
      <TrendingCourses initialCourses={courses} />
      <HomeShelves newest={newest} free={free} beginner={beginner} />
      <RankingBanner />
    </>
  );
}
