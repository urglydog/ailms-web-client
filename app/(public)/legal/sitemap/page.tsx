import Link from 'next/link';

const GROUPS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Khóa học', href: '/courses' },
      { label: 'Về chúng tôi', href: '/about' },
      { label: 'Giảng dạy trên LinguaLearn', href: '/teaching' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { label: 'Đăng nhập', href: '/login' },
      { label: 'Đăng ký', href: '/register' },
      { label: 'Hồ sơ cá nhân', href: '/profile' },
      { label: 'Khóa học của tôi', href: '/my-courses' },
      { label: 'Danh sách yêu thích', href: '/wishlist' },
      { label: 'Giỏ hàng', href: '/cart' },
      { label: 'Lịch sử giao dịch', href: '/payments' },
    ],
  },
  {
    title: 'Pháp lý & Chính sách',
    links: [
      { label: 'Điều khoản dịch vụ', href: '/legal/terms' },
      { label: 'Chính sách quyền riêng tư', href: '/legal/privacy' },
      { label: 'Chính sách hoàn tiền', href: '/legal/refund' },
      { label: 'Chính sách chia sẻ doanh thu Giảng viên', href: '/legal/revenue-share' },
      { label: 'Quy định kiểm duyệt nội dung', href: '/legal/content-moderation' },
      { label: 'Chính sách Cookie', href: '/legal/cookies' },
      { label: 'Tuyên bố khả năng tiếp cận', href: '/legal/accessibility' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">Sơ đồ trang</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            <h2 className="m-0 font-display text-[15px] font-semibold text-ink">{group.title}</h2>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-[13.5px] text-ink-muted hover:text-accent">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
