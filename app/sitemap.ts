import type { MetadataRoute } from 'next';
import { EMPTY_FILTERS, publicCoursesApi } from '@/lib/api/publicCourses';
import { siteUrl } from '@/lib/siteUrl';

/** Dựng lại tối đa mỗi giờ — danh sách khóa công khai đổi không thường xuyên, tránh gọi BE mỗi lần bot ghé. */
export const revalidate = 3600;

const STATIC_PATHS = ['', '/courses', '/about', '/legal/terms', '/legal/privacy', '/legal/refund', '/legal/revenue-share'];

/**
 * Sơ đồ trang cho công cụ tìm kiếm (Giai đoạn D, 11/11/2026): trang tĩnh + tối đa 100 khóa công khai mới nhất. Chỉ khóa
 * PUBLIC đã xuất bản xuất hiện (cùng bộ lọc với trang danh sách công khai). BE lỗi thì vẫn trả các trang tĩnh.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' || path === '/courses' ? 'daily' : 'monthly',
  }));
  try {
    const courses = await publicCoursesApi.search(EMPTY_FILTERS, 'newest', 100);
    for (const c of courses) {
      entries.push({ url: `${base}/courses/${encodeURIComponent(c.slug)}`, changeFrequency: 'weekly' });
    }
  } catch {
    // không có danh sách khóa vẫn trả sitemap tĩnh
  }
  return entries;
}
