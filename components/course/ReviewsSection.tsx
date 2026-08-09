'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { StarRatingInput } from '@/components/ui/StarRatingInput';
import { useCourseReviews, useCreateReview } from '@/hooks/useReviews';
import { ApiError } from '@/lib/api/client';
import { getCurrentRole } from '@/lib/auth/token';

const AVATAR_COLORS = ['#0891B2', '#7C3AED', '#16A34A', '#EA580C', '#DB2777', '#0284C7'];

function avatarColor(name: string): string {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]!;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Danh sách đánh giá + form viết đánh giá (UC23). Không có mẫu thiết kế cho form — tự
 * thiết kế mới, tái dùng `card`/`accent` token sẵn có của hệ thống thiết kế trang công khai.
 *
 * Không kiểm tra "đã sở hữu khóa chưa" trước khi hiện form (tránh gọi thêm 1 API riêng
 * chỉ để kiểm tra) — cứ hiện form cho mọi Student đã đăng nhập, nếu BE từ chối vì chưa sở
 * hữu (BR-ENROLL-01) thì hiện thông báo lỗi ngay dưới form.
 */
export function ReviewsSection({ courseId }: { courseId: number }) {
  const { data, isLoading } = useCourseReviews(courseId);
  const createReview = useCreateReview(courseId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isStudent = isMounted && getCurrentRole() === 'STUDENT';
  const reviews = data?.content ?? [];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    createReview.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setSubmitted(true);
          setRating(0);
          setComment('');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {isStudent && !submitted && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-5">
          <span className="font-display text-sm font-semibold text-ink">Viết đánh giá của bạn</span>
          <StarRatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Chia sẻ cảm nhận của bạn về khóa học (không bắt buộc)..."
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink
                       placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          {createReview.error instanceof ApiError && (
            <p className="text-sm text-red-600">{createReview.error.message}</p>
          )}
          <button
            type="submit"
            disabled={rating === 0 || createReview.isPending}
            className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white
                       hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createReview.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}

      {submitted && (
        <div className="card p-4 text-sm text-success">Cảm ơn bạn đã đánh giá khóa học!</div>
      )}

      {isLoading && <p className="text-sm text-ink-muted">Đang tải đánh giá...</p>}

      {!isLoading && reviews.length === 0 && (
        <p className="text-sm text-ink-muted">Chưa có đánh giá nào cho khóa học này.</p>
      )}

      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <article key={review.id} className="card flex gap-3.5 p-5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display
                         text-sm font-bold text-white"
              style={{ backgroundColor: avatarColor(review.userName) }}
              aria-hidden
            >
              {review.userName.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-ink">{review.userName}</span>
                <span className="text-xs text-ink-faint">{formatDate(review.createdAt)}</span>
              </div>
              {/* Danh sách đánh giá hiện đủ 5 icon sao (khác CourseCard — nơi đó chỉ cần
                  1 icon + số điểm trung bình, xem components/ui/StarRating.tsx). */}
              <div className="flex items-center gap-0.5 text-star" aria-label={`${review.rating} trên 5 sao`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} aria-hidden>
                    {star <= review.rating ? '★' : '☆'}
                  </span>
                ))}
              </div>
              {review.comment && (
                <p className="text-sm leading-relaxed text-ink-muted">{review.comment}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
