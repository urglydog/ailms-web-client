'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authApi } from '@/lib/api/auth';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { ApiError } from '@/lib/api/client';
import { getStoredUiLanguage, LanguageModal } from '@/components/layout/LanguageModal';
import type { CartItem, WishlistItem } from '@/types/domain';

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

/** Hover mở dropdown + đóng có độ trễ ngắn (kiểu Udemy) — dùng chung cho các icon ở Header
 * (yêu thích, giỏ hàng) thay vì lặp lại state/timeout riêng cho từng icon. */
function useHoverDropdown() {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openNow = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const closeWithDelay = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };
  return { open, openNow, closeWithDelay };
}

export function Header() {
  const router = useRouter();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  // Giỏ hàng (06/09/2026, mở rộng ngoài đặc tả gốc) — badge số lượng THẬT, thay số "2" gắn
  // cứng cũ (icon giỏ hàng vốn để sẵn từ trước nhưng chưa từng nối API/route thật).
  const { data: cartItems } = useCart();
  const cartCount = cartItems?.length ?? 0;
  const cartTotal = cartItems?.reduce((sum, item) => sum + item.price, 0) ?? 0;
  // Danh sách yêu thích (14/09/2026) — không hiện số đếm ở icon (theo yêu cầu trước), nhưng
  // vẫn cần dữ liệu để đổ vào dropdown xem nhanh khi hover.
  const { data: wishlistItems } = useWishlist();
  const wishlistHover = useHoverDropdown();
  const cartHover = useHoverDropdown();
  const [searchText, setSearchText] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [uiLanguage, setUiLanguage] = useState('Tiếng Việt');
  const closeMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown tài khoản (14/09/2026, đổi kiểu Udemy) — dùng chung 1 nguồn sự thật cho hồ sơ
  // (`useCurrentUser`) thay vì tự decode JWT lấy tên/role như trước, để avatar/tên ở đây LUÔN
  // đồng bộ ngay sau khi đổi ở trang Hồ sơ cá nhân (JWT decode cũ không tự cập nhật được).
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
    setUiLanguage(getStoredUiLanguage());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Hover mở dropdown (kiểu Udemy) + vẫn giữ bấm để mở/đóng làm phương án dự phòng cho thiết
   * bị cảm ứng (không có sự kiện hover thật). Đóng có độ trễ ngắn khi rê chuột ra để không bị
   * đóng ngay khi di chuột từ avatar sang menu (khoảng hở giữa 2 phần tử).
   */
  const openAccountMenu = () => {
    if (closeMenuTimeout.current) clearTimeout(closeMenuTimeout.current);
    setAccountMenuOpen(true);
  };
  const scheduleCloseAccountMenu = () => {
    closeMenuTimeout.current = setTimeout(() => setAccountMenuOpen(false), 200);
  };

  /**
   * Tìm khi Enter/click icon — KHÔNG tìm theo từng ký tự gõ (tránh gọi API mỗi keystroke,
   * sẽ giật/lag khi catalog lớn lúc deploy thật). Luôn bắt đầu tìm kiếm mới ở `/courses`,
   * không giữ các bộ lọc khác đang chọn trên trang đó — Header là component toàn cục,
   * không biết state bộ lọc hiện tại của trang con.
   */
  const submitSearch = () => {
    const trimmed = searchText.trim();
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
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
    setAccountMenuOpen(false);
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-line">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3.5 px-8">
          
          {/* Logo & Nav */}
          <div className="flex min-w-0 shrink-0 items-center gap-5">
            <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-white">
                L
              </span>
              <span className="whitespace-nowrap font-display text-[19px] font-bold text-ink">
                LinguaLearn
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/courses" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-surface no-underline">
                Khóa học
              </Link>
              {isLoggedIn && (
                <Link href="/my-courses" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-surface no-underline">
                  Khóa học của tôi
                </Link>
              )}
              {/* F11.9 — lối vào mới cho trang khám phá buổi live, không gate theo đăng nhập
                  (Guest vẫn xem được buổi Public — BR-LIVE-01). */}
              <Link href="/live" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-surface no-underline">
                Live
              </Link>
              <Link href="/about" className="rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-surface no-underline">
                Về chúng tôi
              </Link>
            </nav>
          </div>

          {/* Search Bar — tìm khi Enter hoặc click icon, không theo từng ký tự gõ */}
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 md:flex max-w-[340px]">
            <button
              type="button"
              onClick={submitSearch}
              aria-label="Tìm kiếm"
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
              placeholder="Tìm khóa học..."
              className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-muted font-sans"
            />
          </div>

          {/* Actions — thứ tự: Yêu thích → Giỏ hàng → Thông báo (14/09/2026, theo yêu cầu). */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Wishlist Icon + dropdown xem nhanh (14/09/2026, mở rộng ngoài đặc tả gốc) */}
            <div className="relative" onMouseEnter={wishlistHover.openNow} onMouseLeave={wishlistHover.closeWithDelay}>
              <Link href="/wishlist" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </Link>

              {wishlistHover.open && (
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
                          Đi đến danh sách yêu thích
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-ink-muted">Danh sách yêu thích trống.</div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon + dropdown xem nhanh */}
            <div className="relative" onMouseEnter={cartHover.openNow} onMouseLeave={cartHover.closeWithDelay}>
              <Link href="/cart" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {cartHover.open && (
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
                          <span className="font-semibold text-ink">Tổng cộng</span>
                          <span className="font-display font-bold text-accent">{formatPrice(cartTotal)}</span>
                        </div>
                        <Link
                          href="/cart"
                          className="block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-accent-dark"
                        >
                          Đi đến giỏ hàng
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-ink-muted">Giỏ hàng trống.</div>
                  )}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface hover:bg-surface-hover"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-[200] w-80 rounded-2xl border border-line bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                    <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
                      <span className="text-[13.5px] font-bold text-ink">Thông báo</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[11px] font-semibold text-accent hover:text-accent-dark">
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex max-h-80 flex-col overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-[12.5px] text-ink-muted">Không có thông báo nào</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`flex flex-col gap-1 rounded-xl p-3 ${!n.isRead ? 'bg-accent/5' : 'hover:bg-surface'}`}>
                            <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                            <span className="text-[12.5px] text-ink-muted">{n.message}</span>
                            <span className="text-[10px] text-ink-faint">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoggedIn ? (
              <div
                className="relative ml-1"
                ref={accountMenuRef}
                onMouseEnter={openAccountMenu}
                onMouseLeave={scheduleCloseAccountMenu}
              >
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent font-display text-[13px] font-bold text-white uppercase"
                  title={currentUser?.fullName}
                >
                  {currentUser?.avatarUrl ? (
                    <Image src={currentUser.avatarUrl} alt={currentUser.fullName} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'
                  )}
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 z-[200] flex w-64 flex-col rounded-2xl border border-line bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                    <div className="flex items-center gap-3 border-b border-line-soft px-3 py-3 mb-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-base font-bold text-white uppercase">
                        {currentUser?.avatarUrl ? (
                          <Image src={currentUser.avatarUrl} alt={currentUser.fullName} width={44} height={44} className="h-full w-full object-cover" />
                        ) : (
                          currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href="/profile?edit=1"
                          onClick={() => setAccountMenuOpen(false)}
                          className="block truncate text-sm font-bold text-ink hover:text-accent hover:underline"
                        >
                          {currentUser?.fullName || 'Người dùng'}
                        </Link>
                        <p className="truncate text-xs text-ink-muted">{currentUser?.email}</p>
                      </div>
                    </div>

                    {/* Admin links */}
                    {currentUser?.role === 'ADMIN' && (
                      <Link href="/admin" className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-accent-dark bg-accent/10 hover:bg-accent/20 mb-1">
                        Truy cập trang Quản trị
                      </Link>
                    )}

                    {/* Instructor links */}
                    {currentUser?.role === 'INSTRUCTOR' && (
                      <Link href="/instructor" className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-accent-dark bg-accent/10 hover:bg-accent/20 mb-1">
                        Kênh Giảng viên
                      </Link>
                    )}

                    {/* Default student links */}
                    <Link href="/my-courses" className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                      Khóa học của tôi
                    </Link>
                    <Link href="/wishlist" className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                      Danh sách yêu thích
                    </Link>
                    {/* "View public profile" (14/09/2026, mở rộng) — xem hồ sơ của CHÍNH MÌNH
                        đúng như người khác sẽ thấy (theo BR quyền riêng tư đã bật/tắt ở trang
                        Hồ sơ cá nhân). */}
                    {currentUser?.id != null && (
                      <Link href={`/u/${currentUser.id}`} className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                        Xem hồ sơ công khai
                      </Link>
                    )}
                    <Link href="/progress" className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                      Báo cáo tiến độ
                    </Link>
                    <Link href="/payments" className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                      Lịch sử giao dịch
                    </Link>
                    <div className="my-1.5 h-px bg-line-soft"></div>
                    <Link href="/profile" className="rounded-lg px-3 py-2.5 text-[13.5px] text-ink hover:bg-surface">
                      Hồ sơ cá nhân
                    </Link>
                    {/* Ngôn ngữ giao diện (14/09/2026, mở rộng) — CHỈ hiển thị danh sách kiểu
                        Udemy, chưa có logic đổi ngôn ngữ UI thật (xem LanguageModal.tsx). */}
                    <button
                      type="button"
                      onClick={() => setShowLanguageModal(true)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] text-ink hover:bg-surface"
                    >
                      <span>Ngôn ngữ</span>
                      <span className="flex items-center gap-1 text-ink-muted">
                        {uiLanguage}
                        <span aria-hidden>🌐</span>
                      </span>
                    </button>
                    <div className="my-1.5 h-px bg-line-soft"></div>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] font-semibold text-ink hover:bg-surface no-underline"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="cursor-pointer whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-[13.5px] font-bold text-white hover:bg-accent-dark no-underline"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-display text-lg font-bold text-ink">Xác nhận đăng xuất</h3>
            <p className="mb-6 text-sm text-ink-muted">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-full bg-line-soft px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <LanguageModal
          currentLanguage={uiLanguage}
          onClose={() => setShowLanguageModal(false)}
          onSelect={setUiLanguage}
        />
      )}
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
  const { data: cartItems } = useCart();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const inCart = cartItems?.some((c) => c.courseId === item.courseId) ?? false;

  const handleEnrollFree = async () => {
    try {
      await enrollmentsApi.enrollFree(item.courseId);
      toast.success('Ghi danh thành công!');
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'mine'] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không ghi danh được, thử lại sau.');
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
        <p className="mt-0.5 text-[12.5px] font-bold text-ink">{item.isFree ? 'Miễn phí' : formatPrice(item.price)}</p>
        {item.isFree ? (
          <button
            type="button"
            onClick={handleEnrollFree}
            className="mt-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-dark"
          >
            Ghi danh miễn phí
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
            {inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ hàng'}
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
        <p className="mt-0.5 text-[12.5px] font-bold text-ink">{formatPrice(item.price)}</p>
      </div>
    </Link>
  );
}
