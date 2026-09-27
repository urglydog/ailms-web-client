'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useActiveBanner } from '@/hooks/useSystemAnnouncements';

const DISMISS_KEY_PREFIX = 'dismissed-system-banner-';

/** Banner cố định đầu trang khi Admin gửi thông báo mức độ HIGH (vd "Bảo trì hệ thống") — hiện
 * cho MỌI người xem trang, kể cả khách vãng lai chưa đăng nhập (26/09/2026, tính năng mới). Đóng
 * lại thì nhớ theo `id` cụ thể của thông báo đó (localStorage) — thông báo HIGH MỚI hơn (id khác)
 * vẫn hiện lại bình thường dù đã từng đóng thông báo cũ.
 *
 * Đặt ở `app/layout.tsx` (gốc, bên trong `Providers` để dùng được React Query) — hiện ở MỌI
 * layout con (public/authenticated/student/learn/admin/instructor), không riêng 1 nhóm route nào.
 */
export function SystemBanner() {
  const { data: banner } = useActiveBanner();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!banner) {
      setDismissed(true);
      return;
    }
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY_PREFIX + banner.id) === '1');
    } catch {
      setDismissed(false);
    }
  }, [banner]);

  if (!banner || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY_PREFIX + banner.id, '1');
    } catch {
      // localStorage có thể bị chặn (chế độ ẩn danh) — không sao, chỉ mất khả năng nhớ đã đóng.
    }
  };

  return (
    <div className="flex items-center gap-3 bg-warning px-4 py-2.5 text-white sm:px-8">
      <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <strong className="font-bold">{banner.title}</strong>
        <span className="mx-1.5 opacity-80">—</span>
        <span className="opacity-95">{banner.content}</span>
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-full p-1 hover:bg-white/20"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
