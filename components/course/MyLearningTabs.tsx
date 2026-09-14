'use client';

import Link from 'next/link';

/**
 * Thanh tab điều hướng nhanh giữa "Khóa học của tôi" và "Danh sách yêu thích" (14/09/2026, mở
 * rộng ngoài đặc tả gốc) — theo đúng layout trang "My learning" của Udemy: 1 tiêu đề lớn đứng
 * yên (bản dịch tiếng Việt của "My learning") + hàng tab bên dưới để chuyển qua lại, thay vì
 * phải quay lại menu tài khoản ở Header mỗi lần muốn đổi trang. Chỉ 2 tab khớp đúng những gì dự
 * án THẬT SỰ có (Udemy còn "My Lists"/"Certifications"/"Archived"/"Learning tools" — dự án chưa
 * có các tính năng đó nên không thêm tab giả không có nội dung thật).
 *
 * Nền đen full-bleed (14/09/2026, sửa lần 2 theo yêu cầu) — component này CHỈ vẽ chữ (title +
 * tab), không tự vẽ nền: trang cha (`my-courses/page.tsx`/`wishlist/page.tsx`) mới là nơi bọc
 * `bg-ink` full-bleed NẰM NGOÀI `.shell`, cùng kiểu với vùng hero đen ở trang chi tiết khóa học
 * (`courses/[slug]/page.tsx`) — đặt màu nền ở đây (bên trong `.shell` đã có padding) sẽ chỉ tô
 * đen được phần bên trong khung 1280px, không tràn hết chiều ngang màn hình như ảnh Udemy.
 */
const TABS = [
  { href: '/my-courses', label: 'Tất cả khóa học', key: 'courses' },
  { href: '/wishlist', label: 'Yêu thích', key: 'wishlist' },
] as const;

export function MyLearningTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold text-white">Khóa học của tôi</h1>
      <nav className="flex gap-6 border-b border-white/15">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold no-underline hover:no-underline ${
              active === tab.key ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
