import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center px-4">
      <h2 className="text-6xl font-black text-ink mb-4">404</h2>
      <p className="text-lg font-medium text-ink-muted mb-8">
        Không tìm thấy trang. Có vẻ đường dẫn không tồn tại hoặc bạn không có quyền truy cập.
      </p>
      <Link
        href="/"
        className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark transition-colors shadow-sm"
      >
        Trở về Trang chủ
      </Link>
    </div>
  );
}
