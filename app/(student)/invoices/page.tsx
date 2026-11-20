'use client';

import Link from 'next/link';
import { InvoiceList } from '@/components/invoices/InvoiceList';

/** Hóa đơn của học viên: biên lai thanh toán và phiếu hoàn tiền. Biên lai điện tử nội bộ, không phải hóa đơn GTGT. */
export default function StudentInvoicesPage() {
  return (
    <div className="shell flex flex-col gap-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 font-display text-2xl font-bold text-ink">Hóa đơn của tôi</h1>
          <p className="m-0 text-sm text-ink-muted">
            Biên lai thanh toán và phiếu hoàn tiền của bạn. Đây là biên lai điện tử nội bộ, không phải hóa đơn giá trị gia tăng.
          </p>
        </div>
        <Link href="/payments" className="text-sm font-semibold text-accent-dark hover:underline">
          Xem lịch sử giao dịch
        </Link>
      </div>
      <InvoiceList
        title="Chứng từ"
        types={['RECEIPT', 'REFUND']}
        emptyText="Bạn chưa có chứng từ nào. Biên lai sẽ xuất hiện tại đây sau khi bạn thanh toán thành công."
      />
    </div>
  );
}
