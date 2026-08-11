'use client';

import { useState, useEffect } from 'react';
import { useAllReviews, useHideReview, useUnhideReview } from '@/hooks/useReviews';
import { ApiError } from '@/lib/api/client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** UC44 — bám khung `CategoryManager.tsx`: bảng + lỗi cục bộ + confirm trước khi hành động. */
export function ReviewManager() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useAllReviews(0, 50);
  const hideReview = useHideReview();
  const unhideReview = useUnhideReview();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const reviews = data?.content ?? [];

  const handleHide = (id: number, courseTitle: string) => {
    if (!window.confirm(`Ẩn đánh giá này khỏi trang "${courseTitle}"?`)) return;
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
                  {review.isHidden ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                      Đã ẩn
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
                      Đang hiện
                    </span>
                  )}
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
                      onClick={() => handleHide(review.id, review.courseTitle)}
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
    </div>
  );
}
