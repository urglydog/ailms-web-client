'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

export function LogoutSidebarButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="mt-4 flex w-full items-center gap-2 px-2 text-left text-xs font-semibold text-danger no-underline transition-colors duration-150 hover:text-danger"
      >
        <span aria-hidden>🚪</span> Đăng xuất
      </button>
      <ConfirmDialog
        open={showConfirm}
        title="Xác nhận đăng xuất"
        body="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?"
        cancelLabel="Hủy"
        confirmLabel="Đăng xuất"
        tone="danger"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
