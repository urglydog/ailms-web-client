import { HomeHero } from '@/components/home/HomeHero';
import { HomeShelves } from '@/components/home/HomeShelves';
import { TrendingCourses } from '@/components/home/TrendingCourses';
import { RankingBanner } from '@/components/ranking/RankingBanner';
import { categoriesApi } from '@/lib/api/categories';
import { publicCoursesApi, EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { pickCategoryShelves } from '@/lib/home/categoryShelves';
import { TRENDING_FETCH_SIZE } from '@/lib/home/trending';

/**
 * Trang chủ gọi API thật (danh sách khóa nổi bật) — không có route segment động nên
 * `next build` mặc định cố dựng tĩnh (SSG), gọi fetch này NGAY LÚC BUILD. Môi trường CI/CD
 * (GitHub Actions) không có backend đang chạy ở hostname `backend` (đó là tên service nội
 * bộ của Docker Compose) nên build sẽ lỗi `getaddrinfo EAI_AGAIN backend`. Ép render động
 * (mỗi request) để fetch chỉ chạy lúc có người dùng thật truy cập, không chạy lúc build.
 */
export const dynamic = 'force-dynamic';

/** Trang chủ (spec mục 4): hero chia đôi, rồi "Đang thịnh hành" và các hàng Mới ra mắt / Miễn phí / Người mới / Chủ đề. Banner xếp hạng cộng đồng (có sẵn)
 * đặt cuối để không tranh chú ý với hero. */
export default async function HomePage() {
  const [courses, newest, free, beginner] = await Promise.all([
    publicCoursesApi.search(EMPTY_FILTERS, 'rating', TRENDING_FETCH_SIZE),
    publicCoursesApi.search(EMPTY_FILTERS, 'newest', TRENDING_FETCH_SIZE),
    publicCoursesApi.search({ ...EMPTY_FILTERS, priceType: 'free' }, 'reviews', TRENDING_FETCH_SIZE),
    publicCoursesApi.search({ ...EMPTY_FILTERS, level: 'BEGINNER', priceType: 'paid' }, 'rating', TRENDING_FETCH_SIZE),
  ]);

  // Mỗi danh mục một kệ "nổi bật": lỗi ở danh mục nào thì bỏ riêng kệ đó, không làm hỏng cả trang chủ.
  const categories = await categoriesApi.list().catch(() => []);
  const perCategory = await Promise.all(
    categories.map((c) =>
      publicCoursesApi.search({ ...EMPTY_FILTERS, category: c.slug }, 'rating', TRENDING_FETCH_SIZE).catch(() => []),
    ),
  );
  const categoryShelves = pickCategoryShelves(categories, perCategory);

  return (
    <>
      <HomeHero />
      <TrendingCourses initialCourses={courses} />
      <HomeShelves newest={newest} free={free} beginner={beginner} categoryShelves={categoryShelves} />
      <RankingBanner />
    </>
  );
}
