'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMyCourseDetail, useUpdateCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';

/** "Giá cả" — giao diện tham khảo Udemy (19/09/2026, tách khỏi `CourseBuilderForm` cũ). Endpoint
 * cập nhật khóa học là PUT thay-thế-toàn-bộ (`UpdateCourseInput` bắt buộc mọi field cơ bản), nên
 * trang này vẫn phải gửi kèm nguyên các field khác của `course` KHÔNG đổi, chỉ `price` là field
 * người dùng thực sự chỉnh ở đây. */
export function CoursePricingForm({ courseId }: { courseId: number }) {
  const { data: course } = useMyCourseDetail(courseId);
  const updateCourse = useUpdateCourse(courseId);
  const [price, setPrice] = useState('0');

  const initializedRef = useRef(false);
  useEffect(() => {
    if (course && !initializedRef.current) {
      setPrice(String(course.price));
      initializedRef.current = true;
    }
  }, [course]);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setPrice(digitsOnly || '0');
  };
  const priceDisplay = Number(price).toLocaleString('vi-VN');

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!course) return;
    updateCourse.mutate({
      title: course.title,
      description: course.description ?? undefined,
      thumbnailUrl: course.thumbnailUrl ?? undefined,
      categoryId: course.categoryId,
      level: course.level,
      price: Number(price) || 0,
    });
  };

  if (!course) return null;

  return (
    <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-display text-[16px] font-bold text-gray-900">Đặt giá cho khóa học của bạn</h2>
      <p className="mb-4 text-[12.5px] text-gray-500">
        Để 0 nếu đây là khóa học miễn phí. Giá đã lưu sẽ được áp dụng ngay, kể cả khi khóa học đã xuất bản.
      </p>
      {updateCourse.error instanceof ApiError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
          {updateCourse.error.message}
        </div>
      )}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">Giá (đ)</span>
          <input
            type="text"
            inputMode="numeric"
            value={priceDisplay}
            onChange={handlePriceChange}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={updateCourse.isPending}
          className="self-start rounded-full bg-gray-900 px-6 py-3 text-[13.5px] font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {updateCourse.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
