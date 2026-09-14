'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { ApiError } from '@/lib/api/client';
import { MyLearningTabs } from '@/components/course/MyLearningTabs';
import type { WishlistItem } from '@/types/domain';

/**
 * Danh sách yêu thích (14/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả
 * gốc của đồ án (xem `WishlistService.java`). Giao diện lưới thẻ card kiểu Udemy "My
 * learning / Wishlist" (14/09/2026, sửa lần 2 theo yêu cầu): trái tim đặc luôn hiện ở góc
 * ảnh bìa (đã ở trong wishlist rồi, không cần trạng thái rỗng như `CourseCard.tsx`), bấm
 * vào là bỏ khỏi danh sách ngay tại chỗ — không cần nút "Xoá" rời như bản danh sách dọc cũ.
 *
 * Ô tìm kiếm (14/09/2026, sửa lần 3) — theo đúng khuôn "Search my courses" của Udemy và cùng
 * hành vi Enter-to-search đã dùng ở `my-courses/page.tsx`/`Header.tsx` (bấm Enter/icon mới lọc,
 * không lọc theo từng ký tự gõ) để nhất quán trải nghiệm toàn site, dù ở đây lọc thuần phía
 * client trên danh sách đã tải sẵn (không có lý do kỹ thuật phải chờ Enter như khi gọi API).
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

export default function WishlistPage() {
  const { data: wishlistItems, isLoading } = useWishlist();
  const items = useMemo(() => wishlistItems ?? [], [wishlistItems]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => setSearchQuery(searchInput.trim());
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
  };

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => item.courseTitle.toLowerCase().includes(normalizedQuery));
  }, [items, searchQuery]);

  return (
    <div>
      <div className="bg-ink">
        <div className="shell py-8">
          <MyLearningTabs active="wishlist" />
        </div>
      </div>

      <div className="shell py-10">
      {isLoading ? (
        <div className="text-sm text-ink-muted">Đang tải…</div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="text-3xl" aria-hidden>
            ♡
          </span>
          <p className="text-ink-muted">Bạn chưa lưu khóa học nào vào danh sách yêu thích.</p>
          <Link
            href="/courses"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark no-underline"
          >
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-end">
            {/* Nút icon gắn liền input kiểu Udemy (khung vuông màu accent) — bấm nút hoặc Enter đều tìm. */}
            <div className="flex w-full max-w-xs">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm trong danh sách yêu thích…"
                className="w-full rounded-l-lg border border-r-0 border-line bg-surface-raised px-3 py-2 text-sm
                           text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={submitSearch}
                aria-label="Tìm kiếm"
                className="flex shrink-0 items-center justify-center rounded-r-lg border border-accent bg-accent px-3.5 text-white hover:bg-accent-dark"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="text-3xl" aria-hidden>
                🔍
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                Không tìm thấy khóa học phù hợp
              </span>
              <p className="max-w-sm text-sm text-ink-muted">Thử đổi từ khóa khác.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <WishlistCard key={item.courseId} item={item} />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: cartItems } = useCart();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const inCart = cartItems?.some((c) => c.courseId === item.courseId) ?? false;

  const handleEnrollFree = async () => {
    try {
      await enrollmentsApi.enrollFree(item.courseId);
      toast.success('Ghi danh thành công!');
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'mine'] });
      removeFromWishlist.mutate(item.courseId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không ghi danh được, thử lại sau.');
    }
  };

  return (
    <div className="card relative flex flex-col overflow-hidden">
      <Link href={`/courses/${item.courseSlug}`} className="relative block aspect-video overflow-hidden bg-surface no-underline">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.courseTitle}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="rounded-full bg-ink/35 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/85">
              ảnh bìa khoá học
            </span>
          </div>
        )}
      </Link>

      {/* Trái tim đặc — luôn hiển thị vì khóa này chắc chắn đã ở trong wishlist rồi (kiểu Udemy). */}
      <button
        type="button"
        onClick={() => removeFromWishlist.mutate(item.courseId)}
        disabled={removeFromWishlist.isPending}
        aria-label="Bỏ khỏi danh sách yêu thích"
        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[20px] text-red-500 shadow-sm hover:bg-white/90"
      >
        ♥
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/courses/${item.courseSlug}`}
          className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink no-underline hover:text-accent"
        >
          {item.courseTitle}
        </Link>
        <span className="text-xs text-ink-muted">GV. {item.instructorName}</span>

        <StarRating rating={item.avgRating} reviewCount={item.reviewCount} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3">
          <span className="font-display text-[15px] font-bold text-ink">
            {item.isFree ? 'Miễn phí' : formatPrice(item.price)}
          </span>

          {item.isFree ? (
            <button
              type="button"
              onClick={handleEnrollFree}
              className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-accent-dark"
            >
              Ghi danh
            </button>
          ) : (
            <button
              type="button"
              onClick={() => !inCart && addToCart.mutate(item.courseId)}
              disabled={inCart || addToCart.isPending}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                inCart ? 'bg-success/10 text-success' : 'bg-accent text-white hover:bg-accent-dark'
              } disabled:cursor-not-allowed`}
            >
              {inCart ? '✓ Đã có trong giỏ' : addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
