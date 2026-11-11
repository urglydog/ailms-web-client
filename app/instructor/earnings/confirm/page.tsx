'use client';

import Link from 'next/link';
import { Suspense } from 'react';
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
  const token = useSearchParams().get('token') ?? '';
  const confirm = useConfirmFinance();

  return (
    <>
      <PageHeader title="Xác nhận qua email" subtitle="Bạn cần đăng nhập đúng tài khoản giảng viên đã nhận email này." />
      <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
        {!token ? (
          <p role="alert" className="m-0 text-sm text-danger">Liên kết không hợp lệ: thiếu mã xác nhận.</p>
        ) : confirm.isSuccess ? (
          <>
            <p className="m-0 text-sm font-semibold text-success-ink">
              {confirm.data.type === 'PAYOUT'
                ? 'Đã xác nhận yêu cầu rút tiền. Chúng tôi sẽ báo qua email khi đã chuyển khoản.'
                : 'Đã xác nhận tài khoản nhận tiền.'}
            </p>
            <Link href="/instructor/earnings" className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark">
              Về trang Thu nhập
            </Link>
          </>
        ) : (
          <>
            <p className="m-0 text-sm text-ink">Bấm nút bên dưới để hoàn tất xác nhận. Liên kết chỉ dùng được một lần.</p>
            {confirm.isError && (
              <p role="alert" className="m-0 text-sm text-danger">
                {confirm.error instanceof ApiError ? confirm.error.message : 'Không xác nhận được. Liên kết có thể đã hết hạn.'}
              </p>
            )}
            <button
              type="button"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(token)}
              className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {confirm.isPending ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
