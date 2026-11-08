'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

interface LogoutConfirmProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Hộp xác nhận đăng xuất (dịch được); Escape để hủy, focus sẵn ở nút Hủy. */
export function LogoutConfirm({ open, onCancel, onConfirm }: LogoutConfirmProps) {
  const t = useTranslations('instructor.shell');
  return (
    <ConfirmDialog
      open={open}
      title={t('logoutTitle')}
      body={t('logoutBody')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
