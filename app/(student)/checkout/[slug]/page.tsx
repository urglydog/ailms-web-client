'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { couponsApi } from '@/lib/api/coupons';
import { ApiError } from '@/lib/api/client';
import type { CourseDetail } from '@/types/domain';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseSlug = decodeURIComponent(params.slug as string);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingMethod, setPayingMethod] = useState<string | null>(null);

  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

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
      .catch((_err) => {
        toast.error('Không thể tải thông tin khóa học');
        router.push('/courses');
      })
      .finally(() => setLoading(false));
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
        toast.error('Mã giảm giá không áp dụng được cho khóa học này.');
        return;
      }
      setPreview({ finalPrice: result.finalPrice, discountPercent: result.discountPercent });
      setAppliedCode(trimmed);
      toast.success('Đã áp dụng mã giảm giá.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không áp dụng được mã giảm giá, thử lại sau.');
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
      });
      window.location.href = res.paymentUrl;
    } catch (err: unknown) {
      const errorMsg = (err as Record<string, string>)?.detail || 'Có lỗi xảy ra khi thực hiện thanh toán';
      toast.error(errorMsg);
      setPayingMethod(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-ink">Thanh toán khóa học</h1>
          <button 
            onClick={() => (window.history.length > 1 ? router.back() : router.push(`/courses/${courseSlug}`))}
            className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quay lại khóa học
          </button>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {/* Cột trái: Thông tin đơn hàng */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-ink">Thông tin khóa học</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-accent/10" />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-display text-xl font-bold text-ink">{course.title}</h3>
                  <p className="mt-2 text-sm text-ink-muted line-clamp-2">{course.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-muted">
                    <span>Giảng viên:</span>
                    <span className="text-accent">{course.instructorName || 'Đang cập nhật'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-ink">Thông tin bổ sung</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-muted">Họ và tên</label>
                  <input 
                    type="text" 
                    placeholder="Tên của bạn" 
                    className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent" 
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-muted">Số điện thoại</label>
                  <input 
                    type="text" 
                    placeholder="Số điện thoại liên hệ" 
                    className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent" 
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-muted">* Thông tin trên chỉ dùng để liên hệ hỗ trợ khi cần thiết, không ảnh hưởng đến tài khoản thanh toán của bạn.</p>
            </div>
          </div>

          {/* Cột phải: Phương thức thanh toán */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sticky top-24">
              <h2 className="mb-4 text-lg font-bold text-ink">Tóm tắt đơn hàng</h2>
              
              <div className="flex justify-between border-b border-line-soft pb-4">
                <span className="text-ink-muted">Tạm tính</span>
                <span className="font-semibold text-ink">{course.price.toLocaleString('vi-VN')} đ</span>
              </div>

              {finalPrice < course.price && (
                <div className="flex justify-between pt-4 text-sm text-ink-muted">
                  <span>Đã giảm</span>
                  <span className="font-semibold text-danger">-{(course.price - finalPrice).toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="mb-4 border-b border-line-soft pb-4 pt-2">
                {appliedCode ? (
                  <div className="flex items-center justify-between rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-sm">
                    <span className="font-mono font-bold text-success">{appliedCode.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => { setAppliedCode(null); setPreview(null); }}
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
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon(couponCode); } }}
                      placeholder="Mã giảm giá"
                      className="w-full min-w-0 rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon(couponCode)}
                      disabled={applying}
                      className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                    >
                      {applying ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4">
                <span className="text-base font-bold text-ink">Tổng cộng</span>
                <span className="text-xl font-bold text-accent">{finalPrice.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => handlePay('VNPAY')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'VNPAY' ? 'border-accent bg-accent/5' : 'border-line bg-white hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">V</div>
                    <span className="font-semibold text-ink">VNPAY</span>
                  </div>
                  {payingMethod === 'VNPAY' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
                </button>

                <button
                  onClick={() => handlePay('MOMO')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'MOMO' ? 'border-pink-600 bg-pink-50' : 'border-line bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 font-bold text-pink-700">M</div>
                    <span className="font-semibold text-ink">Ví MoMo</span>
                  </div>
                  {payingMethod === 'MOMO' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />}
                </button>

                <button
                  onClick={() => handlePay('ZALOPAY')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'ZALOPAY' ? 'border-green-600 bg-green-50' : 'border-line bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">Z</div>
                    <span className="font-semibold text-ink">ZaloPay</span>
                  </div>
                  {payingMethod === 'ZALOPAY' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />}
                </button>

                <button
                  onClick={() => handlePay('PAYOS')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'PAYOS' ? 'border-ink bg-surface' : 'border-line bg-white hover:border-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-bold text-white">P</div>
                    <span className="font-semibold text-ink">Chuyển khoản QR (PayOS)</span>
                  </div>
                  {payingMethod === 'PAYOS' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />}
                </button>
              </div>
              
              <p className="mt-4 text-center text-xs text-ink-muted">
                Bằng việc thanh toán, bạn đồng ý với Điều khoản dịch vụ của LinguaLearn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
