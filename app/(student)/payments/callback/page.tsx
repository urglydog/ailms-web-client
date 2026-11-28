'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';
import { flagPayosCancelledNotice, takePayosReturn } from '@/lib/payosReturn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function PayosReturnContent() {
  const t = useTranslations('pages.payosReturn');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Chúng ta đã append params status và orderCode vào URL ở Backend (PaymentService.java)
    // Hoặc PayOS tự động append `cancel=true` nếu người dùng hủy thanh toán
    const customStatus = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    const isCancelled = searchParams.get('cancel') === 'true';

    if (!orderCode) {
      setStatus('error');
      return;
    }

    if ((customStatus === 'success' || customStatus === 'PAID') && !isCancelled) {
      setStatus('success');
      
      // Ở đây LUÔN KHÔNG GỌI /ipn-mock vì chúng ta phải tuân thủ nguyên tắc chạy thật.
      // Database sẽ được update khi Backend nhận được webhook thực sự từ PayOS.
    } else {
      setStatus('error');
      // Báo BE đánh dấu đơn PENDING của chính mình là FAILED (best-effort — lỗi không chặn UI), rồi
      // đưa học viên về thẳng trang thanh toán, bỏ qua trang PayOS trong lịch sử (xem lib/payosReturn).
      const ret = takePayosReturn();
      paymentsApi.cancel(orderCode).catch(() => {}).finally(() => {
        if (!ret) return; // không biết quay về đâu (mở trực tiếp) — giữ thẻ kết quả để bấm nút.
        flagPayosCancelledNotice();
        // Lịch sử đúng như dự kiến [Checkout, PayOS, Callback] → lùi 2 bước; lệch thì chuyển thẳng.
        if (window.history.length === ret.historyLength + 2) {
          window.history.go(-2);
        } else {
          router.replace(ret.url);
        }
      });
    }
  }, [searchParams, router]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      {status === 'loading' && (
        <div className="text-ink-muted">{t('processing')}</div>
      )}
      
      {status === 'success' && (
        <div className="card max-w-md p-8 flex flex-col items-center border-t-4 border-t-success shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">{t('successTitle')}</h1>
          <p className="text-sm text-ink-muted mb-6">
            {t('successNote')}
          </p>
          <div className="flex w-full flex-col gap-3">
            <Link
              href="/payments"
              className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white no-underline hover:bg-accent-dark transition-colors"
            >
              {t('viewHistory')}
            </Link>
            <Link
              href="/courses"
              className="text-sm font-semibold text-ink no-underline hover:underline mt-2"
            >
              {t('backToCourses')}
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card max-w-md p-8 flex flex-col items-center border-t-4 border-t-danger shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">{t('failTitle')}</h1>
          <p className="text-sm text-ink-muted mb-6">
            {t('failNote')}
          </p>
          <div className="flex w-full flex-col gap-3">
            <Link 
              href="/courses" 
              className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white no-underline hover:bg-accent-dark"
            >
              {t('backToCourses')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PayosReturnFallback() {
  const t = useTranslations('pages.payosReturn');
  return <div className="flex min-h-[60vh] items-center justify-center">{t('processing')}</div>;
}

export default function PayosReturnPage() {
  return (
    <Suspense fallback={<PayosReturnFallback />}>
      <PayosReturnContent />
    </Suspense>
  );
}
