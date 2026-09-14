'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { StarRating } from '@/components/ui/StarRating';
import { useCart, useRemoveFromCart } from '@/hooks/useCart';
import type { CourseLevel } from '@/types/domain';

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
  const [uncheckedIds, setUncheckedIds] = useState<Set<number>>(new Set());
  const [couponCode, setCouponCode] = useState('');

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
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    const courseIds = selectedItems.map((item) => item.courseId).join(',');
    router.push(`/checkout/cart?courseIds=${courseIds}`);
  };

  // Xoá nhiều (14/09/2026, mở rộng) — xoá thẳng các khóa đang tick chọn, không cần vào từng
  // dòng bấm "Xoá" lần lượt. Gọi song song vì mỗi khóa là 1 bản ghi độc lập trong `cart_items`.
  const handleRemoveSelected = () => {
    selectedItems.forEach((item) => removeFromCart.mutate(item.courseId));
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    toast.info('Tính năng mã giảm giá đang được phát triển, chưa áp dụng được vào đơn hàng.');
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
                  <Link href={`/courses/${item.courseSlug}`} className="line-clamp-2 font-display text-[15px] font-semibold text-ink no-underline hover:text-accent">
                    {item.courseTitle}
                  </Link>
                  <p className="mt-1 text-[13px] text-ink-muted">GV. {item.instructorName}</p>
                  <div className="mt-1.5">
                    <StarRating rating={item.avgRating} reviewCount={item.reviewCount} />
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-faint">
                    {formatHours(item.totalDurationSec)} · {item.totalLessons} bài giảng · {LEVEL_LABEL[item.level]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-display text-[15px] font-bold text-ink">{formatPrice(item.price)}</span>
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
          </div>

          <div className="card sticky top-24 h-fit p-5">
            <h2 className="mb-4 font-display text-base font-bold text-ink">Tóm tắt đơn hàng</h2>
            <div className="flex items-center justify-between border-b border-line-soft pb-3 text-sm text-ink-muted">
              <span>Đã chọn</span>
              <span>{selectedItems.length} / {items.length} khóa học</span>
            </div>
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

            {/* Mã giảm giá (14/09/2026, mở rộng) — CHỈ giao diện, chưa có logic giảm giá thật
                (chưa có khái niệm khuyến mãi/coupon trong hệ thống) — bấm "Áp dụng" báo rõ
                đang phát triển thay vì giả vờ trừ tiền, giữ đúng tinh thần trung thực với
                người dùng như đã làm ở LanguageModal.tsx. */}
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className="mb-2 text-sm font-semibold text-ink">Mã giảm giá</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="w-full min-w-0 rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
