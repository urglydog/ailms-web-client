'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

export function LogoutSidebarButton() {
  const t = useTranslations('instructor.shell');
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
        <span aria-hidden>🚪</span> {t('logout')}
      </button>
      <ConfirmDialog
        open={showConfirm}
        title={t('logoutTitle')}
        body={t('logoutBody')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        tone="danger"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
