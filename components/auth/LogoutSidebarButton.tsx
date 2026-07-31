'use client';

export function LogoutSidebarButton() {
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-4 px-2 text-left text-xs font-semibold text-red-400 no-underline hover:text-red-300 w-full"
    >
      Đăng xuất
    </button>
  );
}
