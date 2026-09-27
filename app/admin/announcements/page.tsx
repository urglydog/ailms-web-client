import { SystemAnnouncementManager } from '@/components/admin/SystemAnnouncementManager';

export default function AdminAnnouncementsPage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Thông báo hệ thống</h1>
      <p className="mb-5 mt-1 text-sm text-gray-500">
        Gửi thông báo tới toàn hệ thống, chỉ Giảng viên, chỉ Học viên, hoặc 1 cá nhân cụ thể. Việc gửi
        chạy nền (job Redis) nên có thể mất vài giây tới vài phút để tới hết người nhận, tuỳ số lượng.
      </p>
      <SystemAnnouncementManager />
    </>
  );
}
