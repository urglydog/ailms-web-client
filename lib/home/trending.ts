import type { CourseSummary } from '@/types/domain';

/** Số thẻ ở hàng "Đang thịnh hành". */
export const TRENDING_LIMIT = 4;

/** Số khóa lấy về từ API, dư để sau khi bỏ khóa đã sở hữu vẫn đủ thẻ. */
export const TRENDING_FETCH_SIZE = 8;

/** Bỏ khóa học học viên ĐÃ SỞ HỮU (trang chủ chỉ gợi ý khóa chưa mua) rồi cắt còn `limit` thẻ.
 * `ownedIds` là `null` khi chưa biết (khách chưa đăng nhập) — không lọc gì. */
export function pickTrending(
  courses: CourseSummary[],
  ownedIds: ReadonlySet<number> | null,
  limit: number = TRENDING_LIMIT,
): CourseSummary[] {
  const visible = ownedIds ? courses.filter((c) => !ownedIds.has(c.id)) : courses;
  return visible.slice(0, limit);
}
