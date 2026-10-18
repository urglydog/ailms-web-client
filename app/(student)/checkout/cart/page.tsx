'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Gift } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { BillingForm } from '@/components/checkout/BillingForm';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { CouponBox } from '@/components/checkout/CouponBox';
import { OrderTotals } from '@/components/checkout/OrderTotals';
import { PayosButton } from '@/components/checkout/PayosButton';
import { useCart } from '@/hooks/useCart';
import { useCartBundleMatches } from '@/hooks/useCartBundleMatches';
import { paymentsApi } from '@/lib/api/payments';
import { getReferralCodesFor } from '@/lib/referral';
import { couponsApi } from '@/lib/api/coupons';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/shop/money';
import type { CouponPriceRes } from '@/types/domain';

/**
 * Thanh toán GỘP (06/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả gốc. Thanh
 * toán các khóa học viên đã chọn từ trang `/cart` (truyền qua query `courseIds`, dạng "10,20,30") —
 * khác `/checkout/[slug]` (luôn đúng 1 khóa, luồng "Mua khóa học" trực tiếp). Đọc lại giỏ hàng thật
 * (`useCart`) rồi lọc theo `courseIds` thay vì gọi thêm 1 API riêng — dữ liệu hiển thị (giá/tên/ảnh)
 * vốn đã có sẵn trong giỏ hàng, không cần trùng lặp.
 */
function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

function CartCheckoutContent() {
  const t = useTranslations('shop');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: cartItems, isLoading } = useCart();
  const [payingMethod, setPayingMethod] = useState<string | null>(null);
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

  const courseIds = useMemo(() => {
    const raw = searchParams.get('courseIds') ?? '';
    return raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
  }, [searchParams]);

  const items = (cartItems ?? []).filter((item) => courseIds.includes(item.courseId));

  // Gói khóa học (29/09/2026) — chạy lại CÙNG 1 thuật toán `matchCartBundles` với `cart/page.tsx`
  // trên đúng tập khóa đang thanh toán, đảm bảo giá hiển thị ở đây khớp tuyệt đối với giá đã
  // thấy ở trang giỏ hàng và với giá BE sẽ chốt lúc `createBatchPayment` (xem
  // `PaymentService.createBatchPayment` — cùng công thức pro-rated + rounding absorption).
  const bundleMatch = useCartBundleMatches(items.map((item) => item.courseId));

  // Mã giảm giá (15/09/2026, mở rộng) — mã có thể đã được áp ở trang giỏ hàng (truyền qua
  // query `coupon`) hoặc nhập lại ở đây; mỗi khóa tự resolve coupon TỐT NHẤT (BR-COUPON-05).
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') ?? '');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [priceMap, setPriceMap] = useState<Map<number, CouponPriceRes>>(new Map());
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const preset = searchParams.get('coupon');
    if (preset && items.length > 0 && !appliedCode) {
      void applyCoupon(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || items.length === 0) return;
    setApplying(true);
    try {
      const results = await couponsApi.previewMany(items.map((item) => item.courseId), trimmed);
      const anyValid = [...results.values()].some((r) => r.enteredCodeValid);
      if (!anyValid) {
        toast.error(t('coupon.invalidMany'));
        return;
      }
      setPriceMap(results);
      setAppliedCode(trimmed);
      toast.success(t('coupon.applied'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('coupon.failed'));
    } finally {
      setApplying(false);
    }
  };

  const finalPriceFor = (item: (typeof items)[number]) =>
    bundleMatch.priceByCartCourseId.get(item.courseId) ?? priceMap.get(item.courseId)?.finalPrice ?? item.finalPrice;
  const total = items.reduce((sum, item) => sum + finalPriceFor(item), 0);
  const totalOriginal = items.reduce((sum, item) => sum + item.price, 0);

  const handlePay = async (method: string) => {
    if (items.length === 0) return;
    try {
      setPayingMethod(method);
      const bundleIds = bundleMatch.matchedBundles.map((m) => m.bundle.id);
      const res = await paymentsApi.createBatch({
        courseIds: items.map((item) => item.courseId),
        paymentMethod: method,
        billingName,
        billingPhone,
        couponCode: appliedCode ?? undefined,
        referralCodes: getReferralCodesFor(items.map((item) => item.courseId)),
        bundleIds: bundleIds.length > 0 ? bundleIds : undefined,
      });
      window.location.href = res.paymentUrl;
    } catch (err: unknown) {
      // Cùng bug với checkout/[slug]/page.tsx — `ApiError` không có field `.detail`, chỉ `.message`.
      toast.error(err instanceof ApiError ? err.message : t('pay.error'));
      setPayingMethod(null);
    }
  };

  if (isLoading) return <Spinner />;

  if (courseIds.length === 0 || items.length === 0) {
    return (
      <div className="shell flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-ink-muted">{t('checkout.noItems')}</p>
        <Link href="/cart" className="text-sm font-semibold text-accent-dark hover:underline">
          ← {t('checkout.backToCart')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface py-10">
      <div className="shell">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">
            {items.length > 1 ? t('checkout.titleMany', { count: items.length }) : t('checkout.titleOne')}
          </h1>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/cart'))}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-tint hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            {t('checkout.backToCart')}
          </button>
        </div>
        <CheckoutSteps current="payment" />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">
                {items.length > 1 ? t('checkout.coursesChosen', { count: items.length }) : t('checkout.course')}
              </h2>
              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const bundle = bundleMatch.bundleByCartCourseId.get(item.courseId);
                  return (
                    <div key={item.courseId} className="flex flex-col gap-4 border-b border-line-soft pb-4 last:border-0 last:pb-0 sm:flex-row">
                      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-tint sm:w-36">
                        {item.thumbnailUrl && <Image src={item.thumbnailUrl} alt="" fill sizes="144px" className="object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-ink">{item.courseTitle}</h3>
                          {bundle && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan px-2 py-0.5 text-[10px] font-bold text-cyan-ink">
                              <Gift size={11} aria-hidden />
                              {t('cart.bundleBadge', { percent: bundle.discountPercent })}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">{t('cart.instructor', { name: item.instructorName })}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center font-display text-base font-bold text-ink">
                        <span>{formatMoney(finalPriceFor(item), locale)}</span>
                        {finalPriceFor(item) < item.price && (
                          <span className="text-xs font-normal text-ink-muted line-through">{formatMoney(item.price, locale)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <BillingForm name={billingName} phone={billingPhone} onNameChange={setBillingName} onPhoneChange={setBillingPhone} />
          </div>

          <div>
            <div className="card sticky top-24 p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">{t('summary.title')}</h2>
              <OrderTotals count={items.length} original={totalOriginal} total={total} />

              <div className="my-4 border-t border-line-soft pt-4">
                <CouponBox
                  value={couponCode}
                  appliedCode={appliedCode}
                  applying={applying}
                  onChange={setCouponCode}
                  onApply={() => void applyCoupon(couponCode)}
                  onRemove={() => {
                    setAppliedCode(null);
                    setPriceMap(new Map());
                  }}
                />
              </div>

              <PayosButton paying={payingMethod === 'PAYOS'} disabled={payingMethod !== null} onPay={() => handlePay('PAYOS')} />

              <p className="mt-4 text-center text-xs text-ink-muted">
                {t.rich('summary.terms', {
                  link: (chunks) => (
                    <Link href="/legal/terms" className="underline hover:text-accent-dark">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartCheckoutPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CartCheckoutContent />
    </Suspense>
  );
}
