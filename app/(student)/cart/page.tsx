'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gift, Lightbulb, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { CouponBox } from '@/components/checkout/CouponBox';
import { OrderTotals } from '@/components/checkout/OrderTotals';
import { ShopEmptyState } from '@/components/checkout/ShopEmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart, useCart, useRemoveFromCart } from '@/hooks/useCart';
import { useCartBundleMatches } from '@/hooks/useCartBundleMatches';
import { couponsApi } from '@/lib/api/coupons';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/shop/money';
import type { CouponPriceRes } from '@/types/domain';

function formatHours(totalSec: number): string {
  const hours = totalSec / 3600;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
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
 *
 * Giỏ hàng đọc từ query cần token nên chỉ biết sau khi mount; chờ mount mới chọn giữa "đang tải" và "trống" để
 * HTML máy chủ và máy khách khớp nhau.
 */
export default function CartPage() {
  const t = useTranslations('shop');
  const locale = useLocale();
  const router = useRouter();
  const { data: cartItems, isLoading } = useCart();
  const removeFromCart = useRemoveFromCart();
  const addToCart = useAddToCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
      toast.error(t('coupon.selectOne'));
      return;
    }
    setApplying(true);
    try {
      const results = await couponsApi.previewMany(selectedItems.map((item) => item.courseId), code);
      // `enteredCodeValid=false` chỉ khi mã KHÔNG áp dụng được cho khóa đó — vẫn true dù coupon
      // autoApply khác lời hơn thắng (BR-COUPON-01), giá cuối vẫn đúng đã là mức tốt nhất.
      const anyValid = [...results.values()].some((r) => r.enteredCodeValid);
      if (!anyValid) {
        toast.error(t('coupon.invalidMany'));
        return;
      }
      setPriceMap(results);
      setAppliedCode(code);
      toast.success(t('coupon.applied'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('coupon.failed'));
    } finally {
      setApplying(false);
    }
  };

  const showLoading = !mounted || isLoading;

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">{t('cart.title')}</h1>
      <CheckoutSteps current="cart" />

      {showLoading ? (
        <div className="text-ink-muted">{t('cart.loading')}</div>
      ) : items.length === 0 ? (
        <ShopEmptyState kind="cart" message={t('cart.emptyTitle')} cta={t('cart.emptyCta')} href="/courses" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-line-soft pb-3">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 rounded accent-accent" />
                {t('cart.selectAll', { count: items.length })}
              </label>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-white px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
                >
                  <Trash2 size={13} aria-hidden />
                  {t('cart.removeSelected', { count: selectedItems.length })}
                </button>
              )}
            </div>

            {items.map((item) => {
              const bundlePrice = bundleMatch.priceByCartCourseId.get(item.courseId);
              const applied = priceMap.get(item.courseId);
              const finalPrice = bundlePrice ?? applied?.finalPrice ?? item.finalPrice;
              const hasDiscount = bundlePrice !== undefined || !!(applied?.discountPercent ?? item.discountPercent);
              const bundle = bundleMatch.bundleByCartCourseId.get(item.courseId);
              return (
                <div key={item.courseId} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 sm:contents">
                    <input
                      type="checkbox"
                      checked={isChecked(item.courseId)}
                      onChange={() => toggleItem(item.courseId)}
                      className="h-4 w-4 shrink-0 rounded accent-accent"
                      aria-label={t('cart.selectCourse', { title: item.courseTitle })}
                    />
                    <Link
                      href={`/courses/${item.courseSlug}`}
                      className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-tint no-underline"
                    >
                      {item.thumbnailUrl && (
                        <Image src={item.thumbnailUrl} alt="" fill sizes="128px" className="object-cover" />
                      )}
                    </Link>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/courses/${item.courseSlug}`}
                        className="line-clamp-2 font-display text-[15px] font-semibold text-ink no-underline hover:text-accent-dark"
                      >
                        {item.courseTitle}
                      </Link>
                      {bundle && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan px-2 py-0.5 text-[10px] font-bold text-cyan-ink">
                          <Gift size={11} aria-hidden />
                          {t('cart.bundleBadge', { percent: bundle.discountPercent })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-ink-muted">{t('cart.instructor', { name: item.instructorName })}</p>
                    <div className="mt-1.5">
                      <StarRating rating={item.avgRating} reviewCount={item.reviewCount} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-muted">
                      {t('cart.meta', {
                        hours: formatHours(item.totalDurationSec),
                        lessons: item.totalLessons,
                        level: t(`courseLevel.${item.level}`),
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
                    {hasDiscount ? (
                      <div className="flex flex-col sm:items-end">
                        <span className="font-display text-[15px] font-bold text-ink">{formatMoney(finalPrice, locale)}</span>
                        <span className="text-xs text-ink-muted line-through">{formatMoney(item.price, locale)}</span>
                      </div>
                    ) : (
                      <span className="font-display text-[15px] font-bold text-ink">{formatMoney(item.price, locale)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromCart.mutate(item.courseId)}
                      className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-white px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/5"
                    >
                      <Trash2 size={12} aria-hidden />
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Gói khóa học (29/09/2026) — gợi ý mua thêm khóa còn thiếu để kích hoạt giảm giá
                combo, hiện ngay khi giỏ hàng đã có sẵn 1 khóa thuộc gói nhưng chưa đủ bộ. */}
            {bundleMatch.partialSuggestions.map(({ bundle, missingCourse }) => (
              <div
                key={`${bundle.id}-${missingCourse.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-cyan bg-tint px-4 py-3"
              >
                <p className="m-0 flex items-start gap-2 text-sm text-ink">
                  <Lightbulb size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    {t.rich('cart.bundleSuggest', {
                      title: missingCourse.title,
                      price: formatMoney(missingCourse.price, locale),
                      percent: bundle.discountPercent,
                      bundle: bundle.title,
                      b: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => addToCart.mutate(missingCourse.id)}
                  disabled={addToCart.isPending}
                  className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {t('cart.addToCart')}
                </button>
              </div>
            ))}
          </div>

          <div className="card sticky top-24 h-fit p-5">
            <h2 className="mb-4 font-display text-base font-bold text-ink">{t('summary.title')}</h2>
            <OrderTotals
              count={selectedItems.length}
              selectedOf={{ selected: selectedItems.length, total: items.length }}
              original={totalOriginal}
              total={total}
            />
            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="mt-4 w-full rounded-full bg-accent px-6 py-3 font-display text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('pay.proceed')}
            </button>

            {/* Mã giảm giá (15/09/2026, mở rộng) — mỗi khóa ĐANG CHỌN tự resolve coupon tốt
                nhất của riêng nó với cùng mã nhập (BR-COUPON-05), xem `couponsApi.previewMany`. */}
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className="mb-2 text-sm font-semibold text-ink">{t('coupon.title')}</p>
              <CouponBox
                value={couponCode}
                appliedCode={appliedCode}
                applying={applying}
                onChange={setCouponCode}
                onApply={() => void handleApplyCoupon()}
                onRemove={() => {
                  setAppliedCode(null);
                  setPriceMap(new Map());
                  setCouponCode('');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
