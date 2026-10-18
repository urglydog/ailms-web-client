'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { BillingForm } from '@/components/checkout/BillingForm';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { CouponBox } from '@/components/checkout/CouponBox';
import { OrderTotals } from '@/components/checkout/OrderTotals';
import { PayosButton } from '@/components/checkout/PayosButton';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { couponsApi } from '@/lib/api/coupons';
import { ApiError } from '@/lib/api/client';
import { paymentsApi } from '@/lib/api/payments';
import { getReferralCode } from '@/lib/referral';
import type { CourseDetail } from '@/types/domain';

function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

/** Thanh toán đúng 1 khóa (luồng "Mua khóa học" từ trang chi tiết). */
function CheckoutPageContent() {
  const t = useTranslations('shop');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseSlug = decodeURIComponent(params.slug as string);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingMethod, setPayingMethod] = useState<string | null>(null);

  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  // "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) — chỉ hiện khi `course.requiresPassword`.
  const [courseAccessPassword, setCourseAccessPassword] = useState('');

  // Mã giảm giá (15/09/2026, mở rộng) — UC57. `finalPrice`/`discountPercent` mặc định đến từ
  // coupon autoApply (BR-COUPON-04); nhập mã ở đây có thể thay bằng mức tốt hơn (BR-COUPON-01).
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') ?? '');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ finalPrice: number; discountPercent: number | null } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!courseSlug) return;
    publicCoursesApi.getBySlug(courseSlug)
      .then((data) => {
        setCourse(data);
      })
      .catch(() => {
        toast.error(t('checkout.loadError'));
        router.push('/courses');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug, router]);

  useEffect(() => {
    const preset = searchParams.get('coupon');
    if (preset && course && !appliedCode) {
      void applyCoupon(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || !course) return;
    setApplying(true);
    try {
      const result = await couponsApi.preview({ courseId: course.id, code: trimmed });
      if (!result.enteredCodeValid) {
        toast.error(t('coupon.invalidOne'));
        return;
      }
      setPreview({ finalPrice: result.finalPrice, discountPercent: result.discountPercent });
      setAppliedCode(trimmed);
      toast.success(t('coupon.applied'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('coupon.failed'));
    } finally {
      setApplying(false);
    }
  };

  const finalPrice = preview?.finalPrice ?? course?.finalPrice ?? course?.price ?? 0;

  const handlePay = async (method: string) => {
    if (!course) return;
    try {
      setPayingMethod(method);
      const res = await paymentsApi.create({
        courseId: course.id,
        paymentMethod: method,
        billingName,
        billingPhone,
        couponCode: appliedCode ?? undefined,
        courseAccessPassword: course.requiresPassword ? courseAccessPassword : undefined,
        referralCode: getReferralCode(course.id),
      });
      window.location.href = res.paymentUrl;
    } catch (err: unknown) {
      // BUG THẬT (25/09/2026): `ApiError` không có field `.detail` (chỉ có `.message`, xem
      // `lib/api/client.ts`) — trước đây luôn rơi về thông báo chung chung, không hiện được lý
      // do thật từ BE. Sửa giống `applyCoupon` ở trên.
      toast.error(err instanceof ApiError ? err.message : t('pay.error'));
      setPayingMethod(null);
    }
  };

  if (loading) return <Spinner />;
  if (!course) return null;

  return (
    <div className="bg-surface py-10">
      <div className="shell">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">{t('checkout.titleOne')}</h1>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(`/courses/${courseSlug}`))}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-tint hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            {t('checkout.backToCourse')}
          </button>
        </div>
        <CheckoutSteps current="payment" />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">{t('checkout.courseInfo')}</h2>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-tint sm:w-48">
                  {course.thumbnailUrl && <Image src={course.thumbnailUrl} alt="" fill sizes="192px" className="object-cover" />}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-display text-xl font-bold text-ink">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{course.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-muted">
                    <span>{t('checkout.instructor')}</span>
                    <span className="text-accent-dark">{course.instructorName || t('checkout.updating')}</span>
                  </div>
                </div>
              </div>
            </div>

            <BillingForm name={billingName} phone={billingPhone} onNameChange={setBillingName} onPhoneChange={setBillingPhone} />

            {course.requiresPassword && (
              <div className="card p-6">
                <h2 className="mb-1 font-display text-lg font-bold text-ink">{t('checkout.passwordTitle')}</h2>
                <p className="mb-3 text-xs text-ink-muted">{t('checkout.passwordNote')}</p>
                <input
                  type="text"
                  aria-label={t('checkout.passwordTitle')}
                  placeholder={t('checkout.passwordPh')}
                  className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  value={courseAccessPassword}
                  onChange={(e) => setCourseAccessPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <div className="card sticky top-24 p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">{t('summary.title')}</h2>
              <OrderTotals count={1} original={course.price} total={finalPrice} />

              <div className="my-4 border-t border-line-soft pt-4">
                <CouponBox
                  value={couponCode}
                  appliedCode={appliedCode}
                  applying={applying}
                  onChange={setCouponCode}
                  onApply={() => void applyCoupon(couponCode)}
                  onRemove={() => {
                    setAppliedCode(null);
                    setPreview(null);
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
