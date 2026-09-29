'use client';

import { useState, useEffect } from 'react';
import { useAllReviews, useHideReview, useUnhideReview } from '@/hooks/useReviews';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError } from '@/lib/api/client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** UC44 — bám khung `CategoryManager.tsx`: bảng + lỗi cục bộ + confirm trước khi hành động. */
export function ReviewManager() {
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States for filtering & pagination
  const [page, setPage] = useState(0);
  const [courseTitleInput, setCourseTitleInput] = useState('');
  const [instructorEmailInput, setInstructorEmailInput] = useState('');
  const [status, setStatus] = useState('ALL');

  // Debounced filters (400ms delay)
  const debouncedCourseTitle = useDebounce(courseTitleInput, 400);
  const debouncedInstructorEmail = useDebounce(instructorEmailInput, 400);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedCourseTitle, debouncedInstructorEmail, status]);

  const { data, isLoading } = useAllReviews(
    page,
    20,
    debouncedCourseTitle,
    debouncedInstructorEmail,
    status
  );

  const hideReview = useHideReview();
  const unhideReview = useUnhideReview();

  useEffect(() => { setMounted(true); }, []);

  const reviews = data?.content ?? [];

  const handleHide = (id: number) => {
    setErrorMessage(null);
    hideReview.mutate(id, {
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : 'Không ẩn được đánh giá này.'),
    });
  };

  const handleUnhide = (id: number) => {
    setErrorMessage(null);
    unhideReview.mutate(id, {
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : 'Không bỏ ẩn được đánh giá này.'),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{errorMessage}</div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <input
          type="text"
          placeholder="Tên khóa học..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          value={courseTitleInput}
          onChange={(e) => setCourseTitleInput(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email giảng viên..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          value={instructorEmailInput}
          onChange={(e) => setInstructorEmailInput(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[150px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="VISIBLE">Đang hiện</option>
          <option value="HIDDEN">Bị ẩn</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Khóa học</th>
              <th className="px-6 py-4">Học viên</th>
              <th className="px-6 py-4">Sao</th>
              <th className="px-6 py-4">Bình luận</th>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!mounted || isLoading) && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {mounted && !isLoading && reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                  Chưa có đánh giá nào.
                </td>
              </tr>
            )}
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">{review.courseTitle}</td>
                <td className="px-6 py-3 text-gray-700">{review.userName}</td>
                <td className="px-6 py-3 text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                <td className="px-6 py-3 max-w-xs truncate text-gray-500" title={review.comment ?? ''}>
                  {review.comment || <span className="text-gray-300">(không có bình luận)</span>}
                </td>
                <td className="px-6 py-3 text-gray-400">{formatDate(review.createdAt)}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-col items-start gap-1">
                    {review.isHidden ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-100">
                        Đã ẩn
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600 border border-green-100">
                        Đang hiện
                      </span>
                    )}
                    {review.isHidden && review.moderationReason && (
                      <span className="text-[11px] text-red-500 font-medium max-w-[150px]">
                        Lý do: {review.moderationReason}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  {review.isHidden ? (
                    <button
                      onClick={() => handleUnhide(review.id)}
                      className="text-xs font-bold text-cyan-600 hover:text-cyan-800"
                    >
                      Hiện lại
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHide(review.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      Ẩn
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-2">
          <button
            disabled={data.first}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {data.number + 1} / {data.totalPages}
          </span>
          <button
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
