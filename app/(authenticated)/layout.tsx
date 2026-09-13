import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

/** Layout cho các trang cần đăng nhập nằm ngoài nhóm `(student)` (hiện tại: thông báo). */
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
