'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist';

interface EnrollButtonProps {
  courseId: number;
  courseSlug: string;
  isFree: boolean;
  enrolled: boolean;
  /** Bài học đầu tiên của khoá (theo thứ tự chương/bài) — null nếu khoá chưa có bài nào. */
  firstLessonId: number | null;
  /** "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) — true khi khóa ở chế độ
   * PRIVATE_PASSWORD, cần nhập đúng mật khẩu mới ghi danh/thanh toán được. */
  requiresPassword: boolean;
}

export function EnrollButton({
  courseId,
  courseSlug,
  isFree,
  enrolled: initialEnrolled,
  firstLessonId,
  requiresPassword,
}: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [accessPassword, setAccessPassword] = useState('');
  // Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — khóa TRẢ PHÍ vừa mua ngay được, vừa
  // thêm vào giỏ để gộp thanh toán sau cùng các khóa khác (giống Udemy). Gọi hook TRƯỚC mọi
  // return sớm bên dưới (rules-of-hooks) dù chỉ dùng ở nhánh trả phí/chưa sở hữu.
  const { data: cartItems } = useCart();
  const inCart = cartItems?.some((item) => item.courseId === courseId) ?? false;
  const addToCart = useAddToCart();

  // Danh sách yêu thích (14/09/2026, mở rộng ngoài đặc tả gốc) — nút tim kiểu Udemy cạnh
  // "Thêm vào giỏ hàng"/"Đăng ký học ngay". Không cần ẩn theo `enrolled` ở đây (khác
  // `CourseCard.tsx`) vì nhánh `enrolled` đã return sớm bên dưới rồi, chưa tới đoạn này.
  const { data: wishlistItems } = useWishlist();
  const inWishlist = wishlistItems?.some((item) => item.courseId === courseId) ?? false;
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistPending = addToWishlist.isPending || removeFromWishlist.isPending;
  const toggleWishlist = () => {
    if (wishlistPending) return;
    if (inWishlist) removeFromWishlist.mutate(courseId);
    else addToWishlist.mutate(courseId);
  };

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
      await enrollmentsApi.enrollFree(courseId, requiresPassword ? accessPassword : undefined);
      toast.success('Ghi danh thành công!');
      router.refresh();
    } catch (err: unknown) {
      // BUG THẬT (25/09/2026): `ApiError` không có field `.detail`, chỉ `.message` — cùng
      // pattern lỗi với checkout/[slug]/page.tsx và checkout/cart/page.tsx.
      toast.error(err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi thực hiện');
    } finally {
      setLoading(false);
    }
  };

  if (isFree) {
    return (
      <div className="flex flex-col gap-2">
        {requiresPassword && (
          <input
            type="text"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            placeholder="Nhập mật khẩu đăng ký"
            className="rounded-full border-2 border-accent/30 px-4 py-2 text-sm focus:border-accent focus:outline-none"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnrollFree}
            disabled={loading || (requiresPassword && !accessPassword.trim())}
            className={`flex-1 rounded-full bg-accent px-6 py-3 font-display text-base font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký học ngay'}
          </button>
          <WishlistHeartButton inWishlist={inWishlist} pending={wishlistPending} onClick={toggleWishlist} />
        </div>
      </div>
    );
  }

  // (14/09/2026, sửa theo yêu cầu) — hàng "Thêm vào giỏ hàng" + tim đứng TRƯỚC "Mua ngay",
  // đúng thứ tự trang chi tiết khóa của Udemy (khác thứ tự cũ: Mua ngay đứng trước).
  //
  // "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) — khóa PRIVATE_PASSWORD không hỗ trợ
  // "Thêm vào giỏ hàng" (BE luôn từ chối, xem CourseAccessService.verifyCanAddToCart), chỉ
  // "Mua ngay" mới có ô nhập mật khẩu (trang checkout).
  return (
    <div className="flex flex-col gap-2.5">
      {!requiresPassword && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => !inCart && addToCart.mutate(courseId)}
            disabled={inCart || addToCart.isPending}
            className="flex-1 rounded-full border-2 border-accent bg-white px-6 py-3 font-display text-base font-bold text-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inCart ? 'Đã có trong giỏ hàng ✓' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
          <WishlistHeartButton inWishlist={inWishlist} pending={wishlistPending} onClick={toggleWishlist} />
        </div>
      )}
      {requiresPassword && (
        <p className="text-center text-[12.5px] text-ink-muted">
          Khóa học riêng tư — nhập mật khẩu ở bước thanh toán để mua trực tiếp.
        </p>
      )}
      <button
        type="button"
        onClick={() => router.push(`/checkout/${courseSlug}`)}
        className="w-full rounded-full bg-accent px-6 py-3 font-display text-base font-bold text-white hover:bg-accent-dark"
      >
        Mua ngay
      </button>
    </div>
  );
}

/**
 * Nút tim kiểu Udemy — ô vuông cạnh nút giỏ hàng/đăng ký. Dùng 1 icon SVG DUY NHẤT cho cả 2
 * trạng thái, chỉ đổi `fill` (rỗng ↔ đặc) — trước đây dùng 2 ký tự Unicode khác nhau (♥/♡),
 * hình dạng lệch nhau rõ giữa 2 trạng thái tùy font hiển thị (đúng lỗi người dùng báo).
 */
function WishlistHeartButton({
  inWishlist, pending, onClick,
}: {
  inWishlist: boolean; pending: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={inWishlist ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
      aria-pressed={inWishlist}
      className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        inWishlist ? 'border-red-500 bg-red-50 text-red-500' : 'border-accent bg-white text-accent hover:bg-accent/5'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
