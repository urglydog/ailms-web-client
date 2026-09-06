'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { toast } from 'sonner';
import { useAddToCart, useCart } from '@/hooks/useCart';

interface EnrollButtonProps {
  courseId: number;
  courseSlug: string;
  isFree: boolean;
  enrolled: boolean;
  /** Bài học đầu tiên của khoá (theo thứ tự chương/bài) — null nếu khoá chưa có bài nào. */
  firstLessonId: number | null;
}

export function EnrollButton({
  courseId,
  courseSlug,
  isFree,
  enrolled: initialEnrolled,
  firstLessonId,
}: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  // Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — khóa TRẢ PHÍ vừa mua ngay được, vừa
  // thêm vào giỏ để gộp thanh toán sau cùng các khóa khác (giống Udemy). Gọi hook TRƯỚC mọi
  // return sớm bên dưới (rules-of-hooks) dù chỉ dùng ở nhánh trả phí/chưa sở hữu.
  const { data: cartItems } = useCart();
  const inCart = cartItems?.some((item) => item.courseId === courseId) ?? false;
  const addToCart = useAddToCart();

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
        // `/learn/{lessonId}` cần ID BÀI HỌC, không phải ID khoá học — bấm vào bài học đầu tiên
        // theo đúng thứ tự chương/bài (BR-COURSE-01 đảm bảo khoá đã publish có ≥1 bài).
        onClick={() => firstLessonId != null && router.push(`/learn/${firstLessonId}`)}
        disabled={firstLessonId == null}
        className="w-full rounded-full bg-success px-6 py-3 font-display text-base font-semibold text-white hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
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
    } catch (err: unknown) {
      toast.error((err as Record<string, string>)?.detail || 'Có lỗi xảy ra khi thực hiện');
    } finally {
      setLoading(false);
    }
  };

  if (isFree) {
    return (
      <button
        type="button"
        onClick={handleEnrollFree}
        disabled={loading}
        className={`w-full rounded-full bg-accent px-6 py-3 font-display text-base font-semibold text-white hover:bg-accent-dark ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Đang xử lý...' : 'Đăng ký học ngay'}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => router.push(`/checkout/${courseSlug}`)}
        className="w-full rounded-full bg-accent px-6 py-3 font-display text-base font-semibold text-white hover:bg-accent-dark"
      >
        Mua ngay
      </button>
      <button
        type="button"
        onClick={() => !inCart && addToCart.mutate(courseId)}
        disabled={inCart || addToCart.isPending}
        className="w-full rounded-full border border-line bg-white px-6 py-3 font-display text-base font-semibold text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {inCart ? 'Đã có trong giỏ hàng ✓' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
      </button>
    </div>
  );
}
