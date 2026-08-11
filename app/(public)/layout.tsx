import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DiscoveryChat } from '@/components/chat/DiscoveryChat';

/** Layout cho các trang công khai: trang chủ, danh sách, chi tiết khoá học. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <DiscoveryChat />
    </div>
  );
}
