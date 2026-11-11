'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Trang bắt buộc đăng nhập (thanh toán...): chưa có phiên thì chuyển sang /login?next=<trang này>
 * để đăng nhập xong quay lại đúng chỗ đang làm dở, thay vì để người dùng bấm thanh toán rồi nhận lỗi 401.
 */
export function useRequireLogin() {
  const router = useRouter();
  useEffect(() => {
    let has = false;
    try {
      has = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');
    } catch {
      /* storage bị chặn: để API tự báo lỗi */
      return;
    }
    if (!has) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [router]);
}
