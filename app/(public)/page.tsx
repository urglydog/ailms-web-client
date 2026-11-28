import { FeaturedShelf } from '@/components/home/FeaturedShelf';
import { HomeAiFeatures } from '@/components/home/HomeAiFeatures';
import { HomeContinue } from '@/components/home/HomeContinue';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeShelves } from '@/components/home/HomeShelves';
import { TrendingCourses } from '@/components/home/TrendingCourses';
import { RankingBanner } from '@/components/ranking/RankingBanner';
import { categoriesApi } from '@/lib/api/categories';
import { publicCoursesApi, EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { pickCategoryShelves } from '@/lib/home/categoryShelves';
import { TRENDING_FETCH_SIZE } from '@/lib/home/trending';

/** Kệ cuộn ngang hiện tối đa 12 thẻ; lấy dư để sau khi bỏ khóa đã sở hữu vẫn đủ. */
const SHELF_FETCH_SIZE = 16;

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

/** Kệ "Được đề xuất" lỗi (BE chưa có endpoint ở bản cũ, mạng chập chờn...) thì chỉ mất kệ đó, không ảnh hưởng cả trang. */
async function safeFeatured() {
  try {
    return await publicCoursesApi.featured('HOME_FEATURED', 8);
  } catch {
    return [];
  }
}

/**
 * Trang chủ (UDEMY_LAYOUT_ANALYSIS mục 2): hero → (đã đăng nhập) Tiếp tục học + streak →
 * (bỏ khối thẻ chủ đề ở đầu trang theo phản hồi 26/11/2026 — trang chủ tập trung giới thiệu khoá học) →
 * kệ Đề xuất / Thịnh hành / Mới / Miễn phí / Người mới / theo danh mục → khối tối giới thiệu AI → bảng xếp hạng thu gọn.
 */
export default async function HomePage() {
  const [courses, newest, free, beginner, featured] = await Promise.all([
    safeSearch(EMPTY_FILTERS, 'rating', TRENDING_FETCH_SIZE),
    safeSearch(EMPTY_FILTERS, 'newest', SHELF_FETCH_SIZE),
    safeSearch({ ...EMPTY_FILTERS, priceType: 'free' }, 'reviews', SHELF_FETCH_SIZE),
    safeSearch({ ...EMPTY_FILTERS, level: 'BEGINNER', priceType: 'paid' }, 'rating', SHELF_FETCH_SIZE),
    safeFeatured(),
  ]);

  // Mỗi danh mục một kệ "nổi bật": lỗi ở danh mục nào thì bỏ riêng kệ đó, không làm hỏng cả trang chủ.
  const categories = await categoriesApi.list().catch(() => []);
  const perCategory = await Promise.all(
    categories.map((c) => safeSearch({ ...EMPTY_FILTERS, category: c.slug }, 'rating', TRENDING_FETCH_SIZE)),
  );
  const categoryShelves = pickCategoryShelves(categories, perCategory);

  return (
    <>
      <HomeHero />
      <HomeContinue
        categoryCourses={categories.map((c, i) => ({ slug: c.slug, name: c.name, courses: perCategory[i] ?? [] }))}
      />
      <FeaturedShelf courses={featured} />
      <TrendingCourses initialCourses={courses} />
      <HomeShelves newest={newest} free={free} beginner={beginner} categoryShelves={categoryShelves} />
      <HomeAiFeatures />
      <RankingBanner />
    </>
  );
}
