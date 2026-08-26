'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

function PayosReturnContent() {
  const searchParams = useSearchParams();
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
      toast.success('Thanh toán thành công! Hệ thống đang xử lý ghi danh.');
      
      // Ở đây LUÔN KHÔNG GỌI /ipn-mock vì chúng ta phải tuân thủ nguyên tắc chạy thật.
      // Database sẽ được update khi Backend nhận được webhook thực sự từ PayOS.
    } else {
      setStatus('error');
      toast.error('Thanh toán thất bại hoặc bị hủy!');
    }
  }, [searchParams]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      {status === 'loading' && (
        <div className="text-ink-muted">Đang xử lý kết quả thanh toán PayOS...</div>
      )}
      
      {status === 'success' && (
        <div className="card max-w-md p-8 flex flex-col items-center border-t-4 border-t-gray-900 shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl mb-4">
            ✅
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Thanh toán thành công</h1>
          <p className="text-sm text-ink-muted mb-6">
            Lưu ý: Khoá học sẽ tự động được mở khóa ngay sau khi hệ thống ghi nhận thành công từ ngân hàng (thường mất 1-2 phút).
          </p>
          <div className="flex w-full flex-col gap-3">
            <Link 
              href="/payments" 
              className="w-full rounded-full bg-gray-900 px-6 py-3 font-semibold text-white no-underline hover:bg-black transition-colors"
            >
              Xem lịch sử giao dịch
            </Link>
            <Link 
              href="/courses" 
              className="text-sm font-semibold text-gray-900 no-underline hover:underline mt-2"
            >
              Quay lại kho khóa học
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card max-w-md p-8 flex flex-col items-center border-t-4 border-t-danger shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-3xl mb-4">
            ❌
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Giao dịch không thành công</h1>
          <p className="text-sm text-ink-muted mb-6">
            Thanh toán đã bị hủy hoặc có lỗi xảy ra. Vui lòng thử lại.
          </p>
          <div className="flex w-full flex-col gap-3">
            <Link 
              href="/courses" 
              className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white no-underline hover:bg-accent-dark"
            >
              Quay lại kho khóa học
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayosReturnPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center">Đang xử lý kết quả thanh toán PayOS...</div>}>
      <PayosReturnContent />
    </Suspense>
  );
}
