import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { bundlesApi } from '@/lib/api/bundles';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { getAccessToken } from '@/lib/auth/token';
import { matchCartBundles, type CartBundleMatch } from '@/lib/bundles/matchCartBundles';

/** Enrollments của học viên hiện tại — dùng để nhận diện Pro-rated Pricing (đã sở hữu 1 khóa
 * trong bundle thì chỉ cần giỏ có đúng (các) khóa còn lại là đã đủ điều kiện giảm giá gói).
 * Export để `BundleUpsellWidget` tái dùng khi lọc khóa "đã sở hữu" lúc thêm cả bundle vào giỏ. */
export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => enrollmentsApi.listMine(),
    // Guest chưa đăng nhập gọi API này sẽ ra 401 — cùng pattern `enabled: !!getAccessToken()`
    // đã dùng ở useCart/useMyBundles, không tự chế check đăng nhập kiểu khác.
    enabled: !!getAccessToken(),
  });
}

/** Khớp combo (Bundle) với nội dung giỏ hàng thật — nguồn duy nhất dùng chung giữa
 * `cart/page.tsx` và `checkout/cart/page.tsx` (xem `matchCartBundles`). */
export function useCartBundleMatches(cartCourseIds: number[]): CartBundleMatch {
  // Chuẩn hoá key: sort + join thành chuỗi ổn định — mảng truyền vào tạo lại mỗi lần component
  // re-render (gõ coupon, tick checkbox...), nếu dùng thẳng mảng đó làm queryKey, React Query
  // coi là key khác nhau mỗi lần và refetch liên tục.
  const sortedIds = useMemo(() => [...cartCourseIds].sort((a, b) => a - b), [cartCourseIds]);
  const idsKey = sortedIds.join(',');

  const { data: enrolled } = useMyEnrollments();
  const enrolledCourseIds = useMemo(() => enrolled?.map((e) => e.courseId) ?? [], [enrolled]);

  const bundlesQuery = useQuery({
    queryKey: ['bundles', 'for-cart', idsKey],
    queryFn: () => bundlesApi.getForCourses(sortedIds),
    enabled: sortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(
    () => matchCartBundles({ cartCourseIds: sortedIds, enrolledCourseIds, bundles: bundlesQuery.data ?? [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idsKey, enrolledCourseIds, bundlesQuery.data],
  );
}
