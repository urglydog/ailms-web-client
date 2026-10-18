'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Heart, Search, SearchX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ShopEmptyState } from '@/components/checkout/ShopEmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/shop/money';
import { MyLearningTabs } from '@/components/course/MyLearningTabs';
import type { WishlistItem } from '@/types/domain';

/**
 * Danh sách yêu thích (14/09/2026) — TÍNH NĂNG MỞ RỘNG, không nằm trong 49 use case đặc tả
 * gốc của đồ án (xem `WishlistService.java`). Lưới thẻ khóa học: trái tim đặc luôn hiện ở góc
 * ảnh bìa (đã ở trong wishlist rồi), bấm vào là bỏ khỏi danh sách ngay tại chỗ. Khóa miễn phí
 * có nút "Đăng ký", khóa có phí có nút thêm vào giỏ hàng.
 *
 * Ô tìm kiếm lọc thuần phía client trên danh sách đã tải sẵn, bấm Enter hoặc nút tìm mới lọc để nhất quán với
 * `my-courses` và `Header.tsx`.
 *
 * Danh sách đọc từ query cần token nên chỉ biết sau khi mount; chờ mount mới chọn giữa "đang tải" và "trống" để
 * HTML máy chủ và máy khách khớp nhau.
 */
export default function WishlistPage() {
  const t = useTranslations('shop.wishlist');
  const { data: wishlistItems, isLoading } = useWishlist();
  const items = useMemo(() => wishlistItems ?? [], [wishlistItems]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      <div className="border-b border-line bg-tint">
        <div className="shell pb-0 pt-8">
          <MyLearningTabs active="wishlist" />
        </div>
      </div>

      <div className="shell py-10">
        {!mounted || isLoading ? (
          <div className="text-sm text-ink-muted">{t('loading')}</div>
        ) : items.length === 0 ? (
          <ShopEmptyState kind="wishlist" message={t('empty')} cta={t('explore')} href="/courses" />
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <div className="flex w-full max-w-xs">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('search')}
                  aria-label={t('searchLabel')}
                  className="w-full rounded-l-lg border border-r-0 border-line bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submitSearch}
                  aria-label={t('searchLabel')}
                  className="flex shrink-0 items-center justify-center rounded-r-lg border border-accent bg-accent px-3.5 text-white hover:bg-accent-dark"
                >
                  <Search size={16} aria-hidden />
                </button>
              </div>
            </div>

            {visibleItems.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
                <SearchX size={32} aria-hidden className="text-accent" />
                <span className="font-display text-lg font-semibold text-ink">{t('noMatch')}</span>
                <p className="max-w-sm text-sm text-ink-muted">{t('noMatchHint')}</p>
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
  const t = useTranslations('shop.wishlist');
  const locale = useLocale();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: cartItems } = useCart();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const inCart = cartItems?.some((c) => c.courseId === item.courseId) ?? false;

  const handleSignUp = async () => {
    try {
      await enrollmentsApi.enrollFree(item.courseId);
      toast.success(t('signedUp'));
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'mine'] });
      removeFromWishlist.mutate(item.courseId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('signUpFailed'));
    }
  };

  return (
    <div className="card relative flex flex-col overflow-hidden">
      <Link href={`/courses/${item.courseSlug}`} className="relative block aspect-video overflow-hidden bg-tint no-underline">
        {item.thumbnailUrl && (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        )}
      </Link>

      {/* Trái tim đặc — luôn hiển thị vì khóa này chắc chắn đã ở trong wishlist rồi (kiểu Udemy). */}
      <button
        type="button"
        onClick={() => removeFromWishlist.mutate(item.courseId)}
        disabled={removeFromWishlist.isPending}
        aria-label={t('remove')}
        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-danger shadow-sm hover:bg-white/90"
      >
        <Heart size={18} aria-hidden className="fill-current" />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/courses/${item.courseSlug}`}
          className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink no-underline hover:text-accent-dark"
        >
          {item.courseTitle}
        </Link>
        <span className="text-xs text-ink-muted">{t('instructor', { name: item.instructorName })}</span>

        <StarRating rating={item.avgRating} reviewCount={item.reviewCount} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3">
          {item.isFree ? (
            <span className="font-display text-[15px] font-bold text-success-ink">{t('free')}</span>
          ) : item.discountPercent ? (
            // Mã giảm giá (15/09/2026, mở rộng) — chỉ coupon `autoApply=true` (BR-COUPON-04).
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-bold text-ink">{formatMoney(item.finalPrice, locale)}</span>
              <span className="text-xs text-ink-muted line-through">{formatMoney(item.price, locale)}</span>
            </div>
          ) : (
            <span className="font-display text-[15px] font-bold text-ink">{formatMoney(item.price, locale)}</span>
          )}

          {item.isFree ? (
            <button
              type="button"
              onClick={handleSignUp}
              className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-accent-dark"
            >
              {t('signUp')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => !inCart && addToCart.mutate(item.courseId)}
              disabled={inCart || addToCart.isPending}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                inCart ? 'bg-success-tint text-success-ink' : 'bg-accent text-white hover:bg-accent-dark'
              } disabled:cursor-not-allowed`}
            >
              {inCart ? t('inCart') : addToCart.isPending ? t('adding') : t('addCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
