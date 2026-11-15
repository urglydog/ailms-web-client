'use client';

import { usePathname } from 'next/navigation';
import { CommunicationTabs } from '@/components/instructor/communication/CommunicationTabs';
import { useNotification } from '@/components/providers/NotificationProvider';
import { sectionBadgeCounts } from '@/lib/instructor/navBadges';

/** "Giao tiếp": Hỏi đáp (tái dùng lesson_chats có sẵn), Tin nhắn, Bài tập, Thông báo. Thanh tab ngang ở trên, nội dung từng mục
 * ở dưới (trước đây là mini-sidebar dọc). */
export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notifications } = useNotification();
  return (
    <div className="flex flex-col gap-5">
      <CommunicationTabs
        pathname={pathname}
        badges={sectionBadgeCounts(notifications, '/instructor/communication/', ['qa', 'messages', 'assignments', 'announcements', 'refunds'])}
      />
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
