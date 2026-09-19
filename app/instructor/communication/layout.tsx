'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { key: 'qa', label: 'Hỏi đáp', href: '/instructor/communication/qa' },
  { key: 'messages', label: 'Tin nhắn', href: '/instructor/communication/messages' },
  { key: 'assignments', label: 'Bài tập', href: '/instructor/communication/assignments' },
  { key: 'announcements', label: 'Thông báo', href: '/instructor/communication/announcements' },
];

/** "Giao tiếp" — giao diện tham khảo Udemy "Communication" (19/09/2026, xây mới): Hỏi đáp (tái
 * dùng lesson_chats có sẵn), Tin nhắn, Bài tập, Thông báo. Cùng khuôn mini-sidebar với
 * `app/instructor/revenue/layout.tsx`. */
export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-[200px_1fr] gap-6">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-[13px] font-semibold no-underline transition-colors ${
                isActive ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
