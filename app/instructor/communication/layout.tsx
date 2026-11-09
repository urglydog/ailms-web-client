'use client';

import { usePathname } from 'next/navigation';
import { CommunicationTabs } from '@/components/instructor/communication/CommunicationTabs';

/** "Giao tiếp": Hỏi đáp (tái dùng lesson_chats có sẵn), Tin nhắn, Bài tập, Thông báo. Thanh tab ngang ở trên, nội dung từng mục
 * ở dưới (trước đây là mini-sidebar dọc). */
export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-5">
      <CommunicationTabs pathname={pathname} />
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
