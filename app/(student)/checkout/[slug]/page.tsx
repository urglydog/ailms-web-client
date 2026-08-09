'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = decodeURIComponent(params.slug as string);
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingMethod, setPayingMethod] = useState<string | null>(null);
  
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

  useEffect(() => {
    if (!courseSlug) return;
    publicCoursesApi.getBySlug(courseSlug)
      .then((data) => {
        setCourse(data);
      })
      .catch((err) => {
        toast.error('Không thể tải thông tin khóa học');
        router.push('/courses');
      })
      .finally(() => setLoading(false));
  }, [courseSlug, router]);

  const handlePay = async (method: string) => {
    try {
      setPayingMethod(method);
      const res = await paymentsApi.create({
        courseId: course.id,
        paymentMethod: method,
        billingName,
        billingPhone
      });
      window.location.href = res.paymentUrl;
    } catch (err: any) {
      toast.error(err.detail || 'Có lỗi xảy ra khi thực hiện thanh toán');
      setPayingMethod(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <h1 className="mb-8 font-display text-3xl font-bold text-gray-900">Thanh toán khóa học</h1>
        
        <div className="grid gap-8 md:grid-cols-3">
          {/* Cột trái: Thông tin đơn hàng */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin khóa học</h2>
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
                    <div className="h-full w-full bg-gradient-to-br from-cyan-100 to-blue-100" />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-display text-xl font-bold text-gray-900">{course.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Giảng viên:</span>
                    <span className="text-cyan-700">{course.instructorName || 'Đang cập nhật'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin bổ sung</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Họ và tên</label>
                  <input 
                    type="text" 
                    placeholder="Tên của bạn" 
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Số điện thoại</label>
                  <input 
                    type="text" 
                    placeholder="Số điện thoại liên hệ" 
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">* Thông tin trên chỉ dùng để liên hệ hỗ trợ khi cần thiết, không ảnh hưởng đến tài khoản thanh toán của bạn.</p>
            </div>
          </div>

          {/* Cột phải: Phương thức thanh toán */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Tóm tắt đơn hàng</h2>
              
              <div className="flex justify-between border-b border-gray-100 pb-4">
                <span className="text-gray-600">Tạm tính</span>
                <span className="font-semibold text-gray-900">{course.price.toLocaleString('vi-VN')} đ</span>
              </div>
              
              <div className="flex justify-between py-4">
                <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                <span className="text-xl font-bold text-cyan-600">{course.price.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => handlePay('VNPAY')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'VNPAY' ? 'border-cyan-600 bg-cyan-50' : 'border-gray-200 bg-white hover:border-cyan-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">V</div>
                    <span className="font-semibold text-gray-900">VNPAY</span>
                  </div>
                  {payingMethod === 'VNPAY' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />}
                </button>

                <button
                  onClick={() => handlePay('MOMO')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'MOMO' ? 'border-pink-600 bg-pink-50' : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 font-bold text-pink-700">M</div>
                    <span className="font-semibold text-gray-900">Ví MoMo</span>
                  </div>
                  {payingMethod === 'MOMO' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />}
                </button>

                <button
                  onClick={() => handlePay('ZALOPAY')}
                  disabled={payingMethod !== null}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    payingMethod === 'ZALOPAY' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">Z</div>
                    <span className="font-semibold text-gray-900">ZaloPay</span>
                  </div>
                  {payingMethod === 'ZALOPAY' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />}
                </button>
              </div>
              
              <p className="mt-4 text-center text-xs text-gray-500">
                Bằng việc thanh toán, bạn đồng ý với Điều khoản dịch vụ của LinguaLearn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
