'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function VnpayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // VNPAY trả về rất nhiều param, quan trọng nhất là vnp_ResponseCode (00 là thành công)
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    const transactionNo = searchParams.get('vnp_TransactionNo');

    if (!responseCode || !txnRef) {
      setStatus('error');
      return;
    }

    if (responseCode === '00') {
      setStatus('success');
      toast.success('Thanh toán thành công!');
      
      // Mặc dù VNPAY server-to-server (IPN) sẽ gọi Backend để xác nhận thực sự,
      // ở môi trường local IPN từ VNPAY có thể không gọi được localhost.
      // Do đó ta có thể trigger mock IPN để đảm bảo db cập nhật (trick cho dev local).
      if (process.env.NODE_ENV === 'development') {
         api.post(`/api/v1/payments/ipn-mock?txnRef=${txnRef}&gatewayTxnNo=${transactionNo}&isSuccess=true`, undefined).catch(console.error);
      }
    } else {
      setStatus('error');
      toast.error('Thanh toán thất bại hoặc bị hủy!');
    }
  }, [searchParams]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      {status === 'loading' && (
        <div className="text-ink-muted">Đang xử lý kết quả thanh toán...</div>
      )}
      
      {status === 'success' && (
        <div className="card max-w-md p-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl mb-4">
            ✅
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Thanh toán thành công</h1>
          <p className="text-sm text-ink-muted mb-6">
            Khóa học đã được thêm vào tài khoản của bạn. Chúc bạn học tốt!
          </p>
          <div className="flex w-full flex-col gap-3">
            <Link 
              href="/payments" 
              className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white no-underline hover:bg-accent-dark"
            >
              Xem lịch sử giao dịch
            </Link>
            <Link 
              href="/courses" 
              className="text-sm font-semibold text-accent no-underline hover:underline"
            >
              Quay lại kho khóa học
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card max-w-md p-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-3xl mb-4">
            ❌
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Giao dịch không thành công</h1>
          <p className="text-sm text-ink-muted mb-6">
            Thanh toán đã bị hủy hoặc có lỗi xảy ra từ ngân hàng. Vui lòng thử lại.
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
