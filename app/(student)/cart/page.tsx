'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart, useCart, useRemoveFromCart } from '@/hooks/useCart';
import { useCartBundleMatches } from '@/hooks/useCartBundleMatches';
import { couponsApi } from '@/lib/api/coupons';
import { ApiError } from '@/lib/api/client';
import type { CouponPriceRes, CourseLevel } from '@/types/domain';

const LEVEL_LABEL: Record<CourseLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function formatHours(totalSec: number): string {
  const hours = totalSec / 3600;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} giờ học`;
}

/**
 * Giỏ hàng (06/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc của đồ
 * án (xem `CartService.java`). Mặc định CHỌN HẾT mọi khoá trong giỏ để thanh toán — học viên
 * tự bỏ chọn khoá nào không muốn thanh toán ngay, không bắt buộc thanh toán toàn bộ giỏ hay
 * đúng 1 khoá duy nhất.
 *
 * Theo dõi "khoá nào BỊ BỎ CHỌN" thay vì "khoá nào ĐANG CHỌN" — khoá mới thêm vào giỏ tự động
 * ở trạng thái đã chọn (đúng nghĩa "mặc định chọn hết") mà không cần đồng bộ lại state mỗi khi
 * danh sách giỏ hàng tải lại (tránh mất lựa chọn thủ công của học viên do refetch).
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

export default function CartPage() {
  const router = useRouter();
  const { data: cartItems, isLoading } = useCart();
  const removeFromCart = useRemoveFromCart();
  const addToCart = useAddToCart();
  const [uncheckedIds, setUncheckedIds] = useState<Set<number>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [priceMap, setPriceMap] = useState<Map<number, CouponPriceRes>>(new Map());
  const [applying, setApplying] = useState(false);

  const items = cartItems ?? [];
  const isChecked = (courseId: number) => !uncheckedIds.has(courseId);
  const toggleItem = (courseId: number) => {
    setUncheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };
  const allChecked = items.length > 0 && items.every((item) => isChecked(item.courseId));
  const toggleAll = () => setUncheckedIds(allChecked ? new Set(items.map((i) => i.courseId)) : new Set());

  const selectedItems = items.filter((item) => isChecked(item.courseId));
  // Gói khóa học (29/09/2026) — khớp combo CHỈ theo các khóa đang được TICK CHỌN: bỏ chọn 1
  // khóa trong combo thì combo đó không còn đủ điều kiện giảm giá nữa (khớp đúng những gì sẽ
  // thực sự được thanh toán), giá hiển thị và `bundleIds` gửi đi khi checkout luôn nhất quán.
  const bundleMatch = useCartBundleMatches(selectedItems.map((item) => item.courseId));

  // Mã giảm giá (15/09/2026, mở rộng) — mỗi khóa tự resolve coupon TỐT NHẤT của riêng nó
  // (BR-COUPON-05): dùng giá đã preview theo mã học viên nhập nếu có, không thì rơi về giá
  // hiển thị mặc định của giỏ hàng (đã tính coupon autoApply, xem `CartService.toRes`).
  // Gói khóa học được ưu tiên TUYỆT ĐỐI hơn coupon — khóa nào đã khớp combo bỏ qua mọi coupon
  // (khớp rule BE: coupon cấp khóa KHÔNG áp dụng cho khóa đang nằm trong bundle).
  const finalPriceFor = (item: (typeof items)[number]) =>
    bundleMatch.priceByCartCourseId.get(item.courseId) ?? priceMap.get(item.courseId)?.finalPrice ?? item.finalPrice;
  const total = selectedItems.reduce((sum, item) => sum + finalPriceFor(item), 0);
  const totalOriginal = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    // Không cần truyền bundleIds qua query — checkout/cart tự chạy lại CÙNG 1 thuật toán
    // `useCartBundleMatches` trên đúng `courseIds` này nên luôn ra kết quả khớp, tránh trường
    // hợp query param cũ (lệch) nếu giỏ hàng đổi giữa lúc rời trang cart và lúc vào checkout.
    const courseIds = selectedItems.map((item) => item.courseId).join(',');
    const couponParam = appliedCode ? `&coupon=${encodeURIComponent(appliedCode)}` : '';
    router.push(`/checkout/cart?courseIds=${courseIds}${couponParam}`);
  };

  // Xoá nhiều (14/09/2026, mở rộng) — xoá thẳng các khóa đang tick chọn, không cần vào từng
  // dòng bấm "Xoá" lần lượt. Gọi song song vì mỗi khóa là 1 bản ghi độc lập trong `cart_items`.
  const handleRemoveSelected = () => {
    selectedItems.forEach((item) => removeFromCart.mutate(item.courseId));
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    if (selectedItems.length === 0) {
      toast.error('Chọn ít nhất 1 khóa học để áp dụng mã giảm giá.');
      return;
    }
    setApplying(true);
    try {
      const results = await couponsApi.previewMany(selectedItems.map((item) => item.courseId), code);
      // `enteredCodeValid=false` chỉ khi mã KHÔNG áp dụng được cho khóa đó — vẫn true dù coupon
      // autoApply khác lời hơn thắng (BR-COUPON-01), giá cuối vẫn đúng đã là mức tốt nhất.
      const anyValid = [...results.values()].some((r) => r.enteredCodeValid);
      if (!anyValid) {
        toast.error('Mã giảm giá không áp dụng được cho các khóa đã chọn.');
        return;
      }
      setPriceMap(results);
      setAppliedCode(code);
      toast.success('Đã áp dụng mã giảm giá.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không áp dụng được mã giảm giá, thử lại sau.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="shell py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Giỏ hàng</h1>

      {isLoading ? (
        <div className="text-ink-muted">Đang tải giỏ hàng...</div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="text-3xl" aria-hidden>🛒</span>
          <p className="text-ink-muted">Giỏ hàng của bạn đang trống.</p>
          <Link href="/courses" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark no-underline">
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-line-soft pb-3">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 rounded accent-accent" />
                Chọn tất cả ({items.length} khóa học)
              </label>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Xoá đã chọn ({selectedItems.length})
                </button>
              )}
            </div>

            {items.map((item) => (
              <div key={item.courseId} className="card flex items-center gap-4 p-4">
                <input
                  type="checkbox"
                  checked={isChecked(item.courseId)}
                  onChange={() => toggleItem(item.courseId)}
                  className="h-4 w-4 shrink-0 rounded accent-accent"
                  aria-label={`Chọn ${item.courseTitle}`}
                />
                <Link href={`/courses/${item.courseSlug}`} className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-line-soft no-underline">
                  {item.thumbnailUrl && (
                    <Image src={item.thumbnailUrl} alt={item.courseTitle} fill sizes="128px" className="object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/courses/${item.courseSlug}`} className="line-clamp-2 font-display text-[15px] font-semibold text-ink no-underline hover:text-accent">
                      {item.courseTitle}
                    </Link>
                    {bundleMatch.bundleByCartCourseId.has(item.courseId) && (
                      <span className="shrink-0 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        🎁 Gói combo -{bundleMatch.bundleByCartCourseId.get(item.courseId)?.discountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-ink-muted">GV. {item.instructorName}</p>
                  <div className="mt-1.5">
                    <StarRating rating={item.avgRating} reviewCount={item.reviewCount} />
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-faint">
                    {formatHours(item.totalDurationSec)} · {item.totalLessons} bài giảng · {LEVEL_LABEL[item.level]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {(() => {
                    const bundlePrice = bundleMatch.priceByCartCourseId.get(item.courseId);
                    const applied = priceMap.get(item.courseId);
                    const finalPrice = bundlePrice ?? applied?.finalPrice ?? item.finalPrice;
                    const hasDiscount = bundlePrice !== undefined || !!(applied?.discountPercent ?? item.discountPercent);
                    return hasDiscount ? (
                      <div className="flex flex-col items-end">
                        <span className="font-display text-[15px] font-bold text-ink">{formatPrice(finalPrice)}</span>
                        <span className="text-xs text-ink-faint line-through">{formatPrice(item.price)}</span>
                      </div>
                    ) : (
                      <span className="font-display text-[15px] font-bold text-ink">{formatPrice(item.price)}</span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => removeFromCart.mutate(item.courseId)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}

            {/* Gói khóa học (29/09/2026) — gợi ý mua thêm khóa còn thiếu để kích hoạt giảm giá
                combo, hiện ngay khi giỏ hàng đã có sẵn 1 khóa thuộc gói nhưng chưa đủ bộ. */}
            {bundleMatch.partialSuggestions.map(({ bundle, missingCourse }) => (
              <div
                key={`${bundle.id}-${missingCourse.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-3"
              >
                <p className="text-sm text-ink">
                  💡 Thêm <span className="font-semibold">{missingCourse.title}</span> (+{formatPrice(missingCourse.price)}) để được giảm{' '}
                  <span className="font-semibold text-cyan-700">{bundle.discountPercent}%</span> theo gói &quot;{bundle.title}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => addToCart.mutate(missingCourse.id)}
                  disabled={addToCart.isPending}
                  className="shrink-0 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
                >
                  Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>

          <div className="card sticky top-24 h-fit p-5">
            <h2 className="mb-4 font-display text-base font-bold text-ink">Tóm tắt đơn hàng</h2>
            <div className="flex items-center justify-between border-b border-line-soft pb-3 text-sm text-ink-muted">
              <span>Đã chọn</span>
              <span>{selectedItems.length} / {items.length} khóa học</span>
            </div>
            {total < totalOriginal && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Đã giảm</span>
                <span className="font-semibold text-danger">-{formatPrice(totalOriginal - total)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <span className="font-display text-base font-bold text-ink">Tổng cộng</span>
              <span className="font-display text-xl font-bold text-accent">{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full rounded-full bg-accent px-6 py-3 font-display text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tiến hành thanh toán
            </button>

            {/* Mã giảm giá (15/09/2026, mở rộng) — mỗi khóa ĐANG CHỌN tự resolve coupon tốt
                nhất của riêng nó với cùng mã nhập (BR-COUPON-05), xem `couponsApi.previewMany`. */}
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className="mb-2 text-sm font-semibold text-ink">Mã giảm giá</p>
              {appliedCode ? (
                <div className="flex items-center justify-between rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-sm">
                  <span className="font-mono font-bold text-success">{appliedCode.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => { setAppliedCode(null); setPriceMap(new Map()); setCouponCode(''); }}
                    className="text-xs font-semibold text-ink-muted hover:text-ink"
                  >
                    Bỏ mã
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleApplyCoupon(); } }}
                    placeholder="Nhập mã giảm giá"
                    className="w-full min-w-0 rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={applying}
                    className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                  >
                    {applying ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
