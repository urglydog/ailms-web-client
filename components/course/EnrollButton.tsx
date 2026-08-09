'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

interface EnrollButtonProps {
  courseId: number;
  courseSlug: string;
  isFree: boolean;
  enrolled: boolean;
}

export function EnrollButton({ courseId, courseSlug, isFree, enrolled: initialEnrolled }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [enrolled, setEnrolled] = useState(initialEnrolled);

  useEffect(() => {
    // Check if user is actually enrolled (since public API always returns false)
    enrollmentsApi.listMine()
      .then((data) => {
        setEnrolled(data.some(e => e.courseId === courseId));
      })
      .catch(() => {});
  }, [courseId]);

  if (enrolled) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/learn/${courseId}`)}
        className="w-full rounded-full bg-success px-6 py-3 font-display text-base font-semibold text-white hover:bg-success/90"
      >
        Học ngay
      </button>
    );
  }

  const handleEnrollFree = async () => {
    try {
      setLoading(true);
      await enrollmentsApi.enrollFree(courseId);
      toast.success('Ghi danh thành công!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.detail || 'Có lỗi xảy ra khi thực hiện');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (method: string) => {
    try {
      setLoading(true);
      const res = await paymentsApi.create({
        courseId,
        paymentMethod: method,
      });
      window.location.href = res.paymentUrl;
    } catch (err: any) {
      toast.error(err.detail || 'Có lỗi xảy ra khi thực hiện');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => isFree ? handleEnrollFree() : router.push(`/checkout/${courseSlug}`)}
      disabled={loading}
      className={`w-full rounded-full bg-accent px-6 py-3 font-display text-base font-semibold text-white hover:bg-accent-dark ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Đang xử lý...' : isFree ? 'Đăng ký học ngay' : 'Mua khoá học'}
    </button>
  );
}
