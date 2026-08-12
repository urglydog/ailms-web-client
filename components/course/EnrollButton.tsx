'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { toast } from 'sonner';

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
