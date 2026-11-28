'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { useConfirmFinance } from '@/hooks/useFinance';
import { ApiError } from '@/lib/api/client';

/** `useSearchParams()` bắt buộc nằm trong Suspense khi build production (bài học từ lần build Vercel trước). */
export default function ConfirmFinancePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmFinanceContent />
    </Suspense>
  );
}

/**
 * Trang đích của liên kết trong email (xác nhận tài khoản nhận tiền / yêu cầu rút). CỐ Ý cần bấm nút thay vì tự xác nhận
 * khi mở trang: một số công cụ quét liên kết trong email mở trước URL và sẽ "ăn" mất token dùng 1 lần.
 */
function ConfirmFinanceContent() {
  const t = useTranslations('instructor.financeConfirm');
  const token = useSearchParams().get('token') ?? '';
  const confirm = useConfirmFinance();
  // Link email thường mở ở trình duyệt/ứng dụng khác (vd mail app trên điện thoại) — nơi chưa đăng nhập.
  // Token xác nhận gắn với đúng tài khoản nên bắt buộc phải đăng nhập; hướng dẫn rõ thay vì báo "không có quyền".
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setLoggedIn(!!localStorage.getItem('accessToken'));
    } catch {
      setLoggedIn(false);
    }
  }, []);
  const nextUrl = encodeURIComponent(`/instructor/earnings/confirm?token=${encodeURIComponent(token)}`);

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
        {!token ? (
          <p role="alert" className="m-0 text-sm text-danger">{t('invalid')}</p>
        ) : loggedIn === false ? (
          <>
            <p className="m-0 text-sm text-ink">{t('notLoggedIn')}</p>
            <Link href={`/login?next=${nextUrl}`} className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark">
              {t('login')}
            </Link>
          </>
        ) : confirm.isSuccess ? (
          <>
            <p className="m-0 text-sm font-semibold text-success-ink">
              {confirm.data.type === 'PAYOUT'
                ? t('payoutConfirmed')
                : t('accountConfirmed')}
            </p>
            <Link href="/instructor/earnings" className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark">
              {t('backToEarnings')}
            </Link>
          </>
        ) : (
          <>
            <p className="m-0 text-sm text-ink">{t('clickToFinish')}</p>
            {confirm.isError && (
              <p role="alert" className="m-0 text-sm text-danger">
                {confirm.error instanceof ApiError ? confirm.error.message : t('failed')}
              </p>
            )}
            <button
              type="button"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(token)}
              className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {confirm.isPending ? t('confirming') : t('confirm')}
            </button>
          </>
        )}
      </div>
    </>
  );
}
