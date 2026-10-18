'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useStreak } from '@/hooks/useStreak';
import { useCategories } from '@/hooks/useCategories';
import { usePublicLiveFeed } from '@/hooks/useLiveView';
import { AccountMenu } from '@/components/layout/header/AccountMenu';
import { ExploreMenu } from '@/components/layout/header/ExploreMenu';
import { isNavItemActive } from '@/components/layout/header/navModel';
import { authApi } from '@/lib/api/auth';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { ApiError } from '@/lib/api/client';
import { LanguageModal } from '@/components/layout/LanguageModal';
import { NotificationMenu } from '@/components/layout/header/NotificationMenu';
import { LOCALE_NATIVE_NAMES, useLocaleStore } from '@/lib/stores/localeStore';
import type { CartItem, WishlistItem } from '@/types/domain';

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

type HeaderDropdownId = 'wishlist' | 'cart' | 'notifications' | 'account' | 'streak';

/**
 * Hover mở dropdown + đóng có độ trễ ngắn (kiểu Udemy) — dùng chung cho 4 icon ở Header (yêu
 * thích, giỏ hàng, thông báo, tài khoản). (26/09/2026, sửa lỗi) — trước đây MỖI icon tự giữ 1
 * state `open` độc lập: rê chuột từ Yêu thích sang Giỏ hàng làm dropdown Giỏ hàng mở lên trong
 * khi dropdown Yêu thích còn treo `closeWithDelay` 200ms CHƯA kịp tắt → 2 khung đè lên nhau.
 * Menu tài khoản ban đầu cũng bị bỏ sót khỏi lần sửa đầu (vẫn giữ state `accountMenuOpen` riêng,
 * đứng sát icon Thông báo nên vẫn có thể đè lên nhau) — giờ gộp nốt vào đây. Giờ CHỈ 1 state
 * `activeId` dùng chung cho cả Header — mở dropdown nào lập tức đóng dropdown khác NGAY (không
 * đợi hết trễ), tự động không bao giờ có 2 dropdown cùng mở.
 */
function useExclusiveHoverDropdown() {
  const [activeId, setActiveId] = useState<HeaderDropdownId | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = (id: HeaderDropdownId) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveId(id);
  };
  const closeWithDelay = (id: HeaderDropdownId) => {
    timeoutRef.current = setTimeout(() => {
      // Chỉ đóng nếu ĐÚNG dropdown này vẫn đang mở — tránh trường hợp hàng đợi timeout cũ của
      // dropdown A vô tình đóng nhầm dropdown B vừa mở ngay sau đó.
      setActiveId((current) => (current === id ? null : current));
    }, 200);
  };
  // Đóng ngay không chờ trễ — dùng cho bấm-để-đóng/mở (menu tài khoản) và bắt "click ra ngoài".
  const closeNow = (id: HeaderDropdownId) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveId((current) => (current === id ? null : current));
  };

  return { activeId, openNow, closeWithDelay, closeNow };
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('header');
  const locale = useLocaleStore((s) => s.locale);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  // Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — badge số lượng THẬT, thay số "2" gắn
  // cứng cũ (icon giỏ hàng vốn để sẵn từ trước nhưng chưa từng nối API/route thật).
  const { data: cartItems } = useCart();
  const cartCount = cartItems?.length ?? 0;
  const cartTotal = cartItems?.reduce((sum, item) => sum + item.finalPrice, 0) ?? 0;
  // Danh sách yêu thích (14/09/2026) — không hiện số đếm ở icon (theo yêu cầu trước), nhưng
  // vẫn cần dữ liệu để đổ vào dropdown xem nhanh khi hover.
  const { data: wishlistItems } = useWishlist();
  // (26/09/2026, sửa lỗi) — 1 state DÙNG CHUNG cho cả 3 dropdown (yêu thích/giỏ hàng/thông báo),
  // xem docblock `useExclusiveHoverDropdown` — trước đây mỗi icon tự giữ state riêng nên rê
  // chuột qua lại giữa 2 icon làm 2 dropdown cùng mở đè lên nhau.
  const headerDropdown = useExclusiveHoverDropdown();
  const [searchText, setSearchText] = useState('');
  // (26/09/2026, tính năng mới) — menu di động: dưới `md` nav chính + ô tìm kiếm trước đây bị
  // ẩn hẳn (`hidden md:flex`) mà KHÔNG có lối vào thay thế nào — học viên dùng điện thoại không
  // điều hướng/tìm kiếm được. Gộp cả 2 vào 1 panel xổ xuống dưới header, mở bằng nút hamburger.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const { data: streakData } = useStreak();
  const { data: categories } = useCategories();
  const { data: liveFeed } = usePublicLiveFeed();
  const liveNow = (liveFeed ?? []).some((s) => s.status === 'LIVE');
  const [prevStreak, setPrevStreak] = useState<number | null>(null);
  // BUG THẬT (03/10/2026) — `reactStrictMode: true` (next.config) khiến React tự gọi LẠI effect
  // này 2 lần liên tiếp cho ĐÚNG 1 lần `streakData` đổi (hành vi cố ý của dev mode, không phải
  // production), nên 2 toast dưới đây hiện 2 lần cho 1 sự kiện thật. Dùng ref giữ THAM CHIẾU
  // `streakData` đã xử lý để lần gọi lặp (cùng tham chiếu, StrictMode không render lại giữa 2 lần
  // gọi) tự bỏ qua — không dùng state vì state cũng bị double-set, không chặn được.
  const toastedStreakDataRef = useRef<typeof streakData>(undefined);

  useEffect(() => {
    if (streakData && streakData === toastedStreakDataRef.current) {
      return;
    }
    toastedStreakDataRef.current = streakData;

    if (streakData && prevStreak !== null && streakData.currentStreak > prevStreak) {
      toast.success(`🔥 Chúc mừng! Chuỗi ngày học của bạn đã lên ${streakData.currentStreak} ngày!`, {
        duration: 5000,
      });
    }
    if (streakData?.justFrozen) {
      toast.info(`🧊 Bạn đã lỡ 1 ngày — hệ thống tự động "đóng băng" để giữ chuỗi ${streakData.currentStreak} ngày của bạn! Còn ${streakData.freezesRemaining} lần đóng băng trong tháng này.`, {
        duration: 7000,
      });
    }
    if (streakData) {
      setPrevStreak(streakData.currentStreak);
    }
  }, [streakData, prevStreak]);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown tài khoản (14/09/2026, đổi kiểu Udemy) — dùng chung 1 nguồn sự thật cho hồ sơ
  // (`useCurrentUser`) thay vì tự decode JWT lấy tên/role như trước, để avatar/tên ở đây LUÔN
  // đồng bộ ngay sau khi đổi ở trang Hồ sơ cá nhân (JWT decode cũ không tự cập nhật được).
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  }, []);

  // Đóng menu di động ngay khi điều hướng sang trang khác — tránh panel còn mở đè lên trang mới.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Dropdown yêu thích/giỏ hàng/thông báo giờ đóng bằng hover-rời-chuột (xem
    // `useExclusiveHoverDropdown`), không cần bắt "click ra ngoài" nữa — chỉ còn menu tài khoản
    // (bấm để mở/đóng, danh sách dài nhiều mục) vẫn cần cơ chế này.
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        headerDropdown.closeNow('account');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [headerDropdown]);

  /**
   * Tìm khi Enter/click icon — KHÔNG tìm theo từng ký tự gõ (tránh gọi API mỗi keystroke,
   * sẽ giật/lag khi catalog lớn lúc deploy thật). Luôn bắt đầu tìm kiếm mới ở `/courses`,
   * không giữ các bộ lọc khác đang chọn trên trang đó — Header là component toàn cục,
   * không biết state bộ lọc hiện tại của trang con.
   */
  const submitSearch = () => {
    const trimmed = searchText.trim();
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
    setMobileMenuOpen(false);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
  };

  const handleLogoutConfirm = async () => {
    // (14/09/2026) — gọi BE thu hồi refresh token trước khi xoá localStorage (BR-AUTH-04);
    // best-effort, `authApi.logout` tự nuốt lỗi nên không cần try/catch ở đây.
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) await authApi.logout(refreshToken);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setShowLogoutModal(false);
    headerDropdown.closeNow('account');
    window.location.href = '/login';
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-white border-b border-line"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3.5 md:px-8">
          
          {/* Logo & Nav */}
          <div className="flex min-w-0 shrink-0 items-center gap-5">
            <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-white">
                L
              </span>
              <span className="hidden whitespace-nowrap font-display text-[19px] font-bold text-ink sm:inline">
                LinguaLearn
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <ExploreMenu categories={categories ?? []} liveNow={liveNow} />
            </nav>
          </div>

          {/* Search Bar — tìm khi Enter hoặc click icon, không theo từng ký tự gõ */}
          <div className="hidden flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 md:flex max-w-[460px]">
            <button
              type="button"
              onClick={submitSearch}
              aria-label={t('search.ariaLabel')}
              className="flex shrink-0 cursor-pointer items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('search.placeholder')}
              className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-muted font-sans"
            />
          </div>

          {/* Actions — thứ tự: Yêu thích → Giỏ hàng → Thông báo (14/09/2026, theo yêu cầu). */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Nút menu di động (26/09/2026, tính năng mới) — chỉ hiện dưới `md`, thay thế lối
                vào nav chính + tìm kiếm vốn bị ẩn hoàn toàn ở màn hình nhỏ. */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? t('mobileMenu.close') : t('mobileMenu.open')}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover md:hidden"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>

            {isLoggedIn && (
              <Link
                href="/my-courses"
                className={`hidden whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-semibold no-underline md:block ${
                  isNavItemActive(pathname, '/my-courses') ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-tint'
                }`}
              >
                {t('nav.myCourses')}
              </Link>
            )}

            {/* Streak Icon + dropdown (chỉ hiện khi đăng nhập) */}
            {isLoggedIn && (
              <div
                className="relative"
                onMouseEnter={() => headerDropdown.openNow('streak')}
                onMouseLeave={() => headerDropdown.closeWithDelay('streak')}
              >
                <div
                  className={`relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 ${
                    streakData?.hasStudiedToday ? 'bg-streak-bg text-streak-ink' : 'bg-surface text-ink-muted'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
                  </svg>
                  <span className="text-[13px] font-bold">{streakData?.currentStreak || 0}</span>
                </div>

                {headerDropdown.activeId === 'streak' && streakData && (
                  <div className="absolute right-0 top-12 z-[200] w-72 rounded-2xl border border-line bg-white p-4 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🔥</span>
                      <div>
                        <h4 className="font-bold text-ink text-[15px]">Chuỗi {streakData.currentStreak} ngày</h4>
                        <p className="text-[12px] text-ink-muted">Kỷ lục: {streakData.longestStreak} ngày</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        const isStudied = streakData.learningDays.includes(dateStr);
                        const isToday = i === 6;
                        
                        return (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <div className="text-[11px] font-semibold text-ink-muted">
                              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] ${
                              isStudied ? 'bg-red-500 text-white font-bold' : 
                              isToday ? 'border-2 border-red-200 text-ink-muted' : 'bg-surface text-ink-muted'
                            }`}>
                              {isStudied ? '✓' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[12px] text-center text-ink-muted mt-4">
                      {streakData.hasStudiedToday ? 'Bạn đã hoàn thành mục tiêu hôm nay!' : 'Học 1 bài học hoặc làm 1 bài quiz để giữ chuỗi!'}
                    </p>
                    <p className="text-[11px] text-center text-ink-faint mt-1.5">
                      🧊 Còn {streakData.freezesRemaining} lần đóng băng streak trong tháng này (tự động áp dụng nếu bạn lỡ 1 ngày)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Icon + dropdown xem nhanh (14/09/2026, mở rộng ngoài đặc tả gốc) */}
            <div
              className="relative"
              onMouseEnter={() => headerDropdown.openNow('wishlist')}
              onMouseLeave={() => headerDropdown.closeWithDelay('wishlist')}
            >
              <Link href="/wishlist" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </Link>

              {headerDropdown.activeId === 'wishlist' && (
                <div className="absolute right-0 top-12 z-[200] w-80 rounded-2xl border border-line bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                  {wishlistItems && wishlistItems.length > 0 ? (
                    <>
                      <div className="flex max-h-96 flex-col gap-1 overflow-y-auto p-1">
                        {wishlistItems.map((item) => (
                          <HeaderWishlistRow key={item.courseId} item={item} />
                        ))}
                      </div>
                      <div className="mt-1 border-t border-line-soft p-2">
                        <Link
                          href="/wishlist"
                          className="block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-accent-dark"
                        >
                          {t('wishlist.viewAll')}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-ink-muted">{t('wishlist.empty')}</div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon + dropdown xem nhanh */}
            <div
              className="relative"
              onMouseEnter={() => headerDropdown.openNow('cart')}
              onMouseLeave={() => headerDropdown.closeWithDelay('cart')}
            >
              <Link href="/cart" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {headerDropdown.activeId === 'cart' && (
                <div className="absolute right-0 top-12 z-[200] w-80 rounded-2xl border border-line bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                  {cartItems && cartItems.length > 0 ? (
                    <>
                      <div className="flex max-h-96 flex-col gap-1 overflow-y-auto p-1">
                        {cartItems.map((item) => (
                          <HeaderCartRow key={item.courseId} item={item} />
                        ))}
                      </div>
                      <div className="mt-1 border-t border-line-soft p-3">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-ink">{t('cart.total')}</span>
                          <span className="font-display font-bold text-accent">{formatPrice(cartTotal)}</span>
                        </div>
                        <Link
                          href="/cart"
                          className="block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-accent-dark"
                        >
                          {t('cart.viewAll')}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-ink-muted">{t('cart.empty')}</div>
                  )}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div
                className="relative"
                onMouseEnter={() => headerDropdown.openNow('notifications')}
                onMouseLeave={() => headerDropdown.closeWithDelay('notifications')}
              >
                <button
                  type="button"
                  onClick={() =>
                    headerDropdown.activeId === 'notifications'
                      ? headerDropdown.closeNow('notifications')
                      : headerDropdown.openNow('notifications')
                  }
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {headerDropdown.activeId === 'notifications' && (
                  <div className="absolute right-0 top-full z-[200] pt-2">
                    <NotificationMenu
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkRead={markAsRead}
                      onMarkAllRead={markAllAsRead}
                      onOpenLink={(url) => {
                        headerDropdown.closeNow('notifications');
                        router.push(url);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {isLoggedIn ? (
              <div
                className="relative ml-1"
                ref={accountMenuRef}
                onMouseEnter={() => headerDropdown.openNow('account')}
                onMouseLeave={() => headerDropdown.closeWithDelay('account')}
              >
                <button
                  type="button"
                  onClick={() =>
                    headerDropdown.activeId === 'account' ? headerDropdown.closeNow('account') : headerDropdown.openNow('account')
                  }
                  aria-expanded={headerDropdown.activeId === 'account'}
                  aria-label={currentUser?.fullName ?? t('account.guestName')}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent font-display text-[13px] font-bold uppercase text-white"
                >
                  {currentUser?.avatarUrl ? (
                    <Image src={currentUser.avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'
                  )}
                </button>
                {headerDropdown.activeId === 'account' && (
                  <div className="absolute right-0 top-full z-[200] pt-2">
                    <AccountMenu
                      user={{
                        id: currentUser?.id ?? null,
                        fullName: currentUser?.fullName ?? '',
                        email: currentUser?.email ?? '',
                        avatarUrl: currentUser?.avatarUrl ?? null,
                        role: currentUser?.role,
                      }}
                      languageName={LOCALE_NATIVE_NAMES[locale]}
                      onNavigate={() => headerDropdown.closeNow('account')}
                      onOpenLanguage={() => setShowLanguageModal(true)}
                      onLogout={() => setShowLogoutModal(true)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2 text-[13.5px] font-semibold text-accent-dark no-underline hover:bg-tint"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/register"
                  className="btn-tactile cursor-pointer whitespace-nowrap rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
                >
                  {t('auth.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Panel menu di động (26/09/2026, tính năng mới) — gộp nav chính + tìm kiếm, chỉ hiện
            dưới `md` khi bấm nút hamburger. */}
        {mobileMenuOpen && (
          <div className="border-t border-line bg-white px-4 py-3 md:hidden">
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <button
                type="button"
                onClick={submitSearch}
                aria-label={t('search.ariaLabel')}
                className="flex shrink-0 cursor-pointer items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('search.placeholder')}
                className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-muted font-sans"
              />
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                href="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold no-underline ${
                  isNavItemActive(pathname, '/courses') ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-surface'
                }`}
              >
                {t('nav.courses')}
              </Link>
              {isLoggedIn && (
                <Link
                  href="/my-courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold no-underline ${
                    isNavItemActive(pathname, '/my-courses') ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-surface'
                  }`}
                >
                  {t('nav.myCourses')}
                </Link>
              )}
              <Link
                href="/live"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold no-underline ${
                  isNavItemActive(pathname, '/live') ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-surface'
                }`}
              >
                {t('nav.live')}
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold no-underline ${
                  isNavItemActive(pathname, '/community') ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-surface'
                }`}
              >
                {t('nav.community')}
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium no-underline ${
                  isNavItemActive(pathname, '/about') ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-surface'
                }`}
              >
                {t('nav.about')}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-display text-lg font-bold text-ink">{t('logoutModal.title')}</h3>
            <p className="mb-6 text-sm text-ink-muted">{t('logoutModal.body')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-full bg-line-soft px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                {t('logoutModal.cancel')}
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                {t('logoutModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && <LanguageModal onClose={() => setShowLanguageModal(false)} />}
    </>
  );
}

/**
 * 1 dòng trong dropdown "Yêu thích" ở Header (14/09/2026, mở rộng) — khác dòng trong dropdown
 * "Giỏ hàng": khóa CHƯA có trong giỏ nên cần nút hành động (ghi danh miễn phí / thêm giỏ hàng)
 * — đúng yêu cầu "không hiện nút thêm-vào-giỏ khi khóa đã ở trong giỏ", cùng logic đã dùng ở
 * `WishlistCard` (trang `/wishlist`).
 */
function HeaderWishlistRow({ item }: { item: WishlistItem }) {
  const t = useTranslations('header');
  const { data: cartItems } = useCart();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const inCart = cartItems?.some((c) => c.courseId === item.courseId) ?? false;

  const handleEnrollFree = async () => {
    try {
      await enrollmentsApi.enrollFree(item.courseId);
      toast.success(t('wishlist.enrollSuccess'));
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'mine'] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('wishlist.enrollError'));
    }
  };

  return (
    <div className="flex gap-3 rounded-xl p-2 hover:bg-surface">
      <Link href={`/courses/${item.courseSlug}`} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-line-soft no-underline">
        {item.thumbnailUrl && (
          <Image src={item.thumbnailUrl} alt={item.courseTitle} fill sizes="80px" className="object-cover" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/courses/${item.courseSlug}`}
          className="line-clamp-1 text-[13px] font-semibold text-ink no-underline hover:text-accent"
        >
          {item.courseTitle}
        </Link>
        <p className="truncate text-[11.5px] text-ink-muted">{item.instructorName}</p>
        <p className="mt-0.5 text-[12.5px] font-bold text-ink">{item.isFree ? t('wishlist.free') : formatPrice(item.finalPrice)}</p>
        {item.isFree ? (
          <button
            type="button"
            onClick={handleEnrollFree}
            className="mt-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-dark"
          >
            {t('wishlist.enrollFree')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => !inCart && addToCart.mutate(item.courseId)}
            disabled={inCart || addToCart.isPending}
            className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              inCart ? 'bg-success/10 text-success' : 'border border-accent text-accent hover:bg-accent/5'
            }`}
          >
            {inCart ? t('wishlist.inCart') : t('wishlist.addToCart')}
          </button>
        )}
      </div>
    </div>
  );
}

/** 1 dòng trong dropdown "Giỏ hàng" ở Header — chỉ hiển thị thông tin, KHÔNG có nút hành động
 * (khóa đã ở trong giỏ rồi, không cần "Thêm vào giỏ" lặp lại — đúng yêu cầu). */
function HeaderCartRow({ item }: { item: CartItem }) {
  return (
    <Link
      href={`/courses/${item.courseSlug}`}
      className="flex gap-3 rounded-xl p-2 no-underline hover:bg-surface"
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-line-soft">
        {item.thumbnailUrl && (
          <Image src={item.thumbnailUrl} alt={item.courseTitle} fill sizes="80px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[13px] font-semibold text-ink">{item.courseTitle}</p>
        <p className="truncate text-[11.5px] text-ink-muted">{item.instructorName}</p>
        <p className="mt-0.5 text-[12.5px] font-bold text-ink">{formatPrice(item.finalPrice)}</p>
      </div>
    </Link>
  );
}
