'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useNotification } from '@/components/providers/NotificationProvider';

export function Header() {
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{name: string, role: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      try {
        // Đọc thông tin từ JWT (phần payload ở giữa)
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          
          // Lấy role an toàn (phòng trường hợp backend trả về string hoặc array)
          let roleStr = 'GUEST';
          if (typeof decoded.role === 'string') roleStr = decoded.role;
          else if (Array.isArray(decoded.roles)) roleStr = decoded.roles[0] || 'GUEST';
          else if (typeof decoded.roles === 'string') roleStr = decoded.roles;
          else if (Array.isArray(decoded.authorities)) roleStr = decoded.authorities.map((a: any) => a.authority || a).join(',');
          else if (typeof decoded.authorities === 'string') roleStr = decoded.authorities;

          // Lấy name
          const nameStr = decoded.name || decoded.fullName || decoded.sub || decoded.email || 'User';
          setUserInfo({ name: nameStr, role: roleStr });
        }
      } catch (e) {
        console.error('Lỗi giải mã JWT:', e);
      }
    }
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowLogoutModal(false);
    setAccountMenuOpen(false);
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3.5 px-8">
          
          {/* Logo & Nav */}
          <div className="flex min-w-0 shrink-0 items-center gap-5">
            <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-base font-bold text-white">
                L
              </span>
              <span className="whitespace-nowrap font-display text-[19px] font-bold text-gray-900">
                LinguaLearn
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/courses" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 no-underline">
                Khóa học
              </Link>
              <Link href="/about" className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 no-underline">
                Về chúng tôi
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 md:flex max-w-[340px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Tìm khóa học..." 
              className="w-full min-w-0 bg-transparent text-[13.5px] text-gray-900 outline-none placeholder:text-gray-500 font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100"
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
                  <div className="absolute right-0 top-12 z-[200] w-80 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                      <span className="text-[13.5px] font-bold text-gray-900">Thông báo</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700">
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex max-h-80 flex-col overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-[12.5px] text-gray-500">Không có thông báo nào</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`flex flex-col gap-1 rounded-xl p-3 ${!n.isRead ? 'bg-cyan-50/50' : 'hover:bg-gray-50'}`}>
                            <span className="text-[13px] font-semibold text-gray-900">{n.title}</span>
                            <span className="text-[12.5px] text-gray-600">{n.message}</span>
                            <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Icon */}
            <Link href="/cart" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-cyan-600 px-1 text-[10.5px] font-bold text-white">
                2
              </span>
            </Link>

            {isLoggedIn ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cyan-600 font-display text-[13px] font-bold text-white uppercase"
                  title={userInfo?.name}
                >
                  {userInfo?.name ? userInfo.name.charAt(0) : 'U'}
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 z-[200] flex w-56 flex-col rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_20px_50px_rgba(19,22,32,0.15)]">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{userInfo?.name || 'Người dùng'}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase">{userInfo?.role || 'Học viên'}</p>
                    </div>

                    {/* Admin links */}
                    {userInfo?.role?.includes('ADMIN') && (
                      <Link href="/admin" className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 mb-1">
                        Truy cập trang Quản trị
                      </Link>
                    )}

                    {/* Instructor links */}
                    {userInfo?.role?.includes('INSTRUCTOR') && (
                      <Link href="/instructor" className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 mb-1">
                        Kênh Giảng viên
                      </Link>
                    )}

                    {/* Default student links */}
                    <Link href="/profile" className="rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 hover:bg-gray-50">
                      Hồ sơ cá nhân
                    </Link>
                    <Link href="/my-courses" className="rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 hover:bg-gray-50">
                      Khóa học của tôi
                    </Link>
                    <Link href="/progress" className="rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 hover:bg-gray-50">
                      Báo cáo tiến độ
                    </Link>
                    <div className="my-1.5 h-px bg-gray-100"></div>
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
                  className="cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-gray-900 hover:bg-gray-50 no-underline"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="cursor-pointer whitespace-nowrap rounded-full bg-cyan-600 px-4 py-2 text-[13.5px] font-bold text-white hover:bg-cyan-700 no-underline"
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
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-display text-lg font-bold text-gray-900">Xác nhận đăng xuất</h3>
            <p className="mb-6 text-sm text-gray-500">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors"
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
    </>
  );
}
