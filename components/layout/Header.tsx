'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/courses', label: 'Kho khóa học' },
  { href: '/#how-it-works', label: 'Cách hoạt động' },
];

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Basic check for token in localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setShowLogoutModal(false);
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface-raised">
        <div className="shell flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-extrabold text-ink no-underline hover:no-underline">
            Lingua<span className="text-accent">Learn</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-muted no-underline hover:text-accent hover:no-underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="text-sm font-medium text-ink">
                  Xin chào, Học viên!
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="rounded-full border border-line bg-surface px-4 py-2 font-display text-sm font-semibold
                             text-ink no-underline hover:bg-surface-raised hover:no-underline"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-ink-muted no-underline hover:text-accent hover:no-underline"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold
                             text-white no-underline hover:bg-accent-dark hover:no-underline"
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
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h3 className="mb-2 font-display text-lg font-bold text-ink">Xác nhận đăng xuất</h3>
            <p className="mb-6 text-sm text-ink-muted">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-full bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
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
