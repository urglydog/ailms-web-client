'use client';

import { useEffect, useMemo, useState } from 'react';
import { disputesApi } from '@/lib/api/disputes';
import { paymentsApi } from '@/lib/api/payments';
import type { PaymentRes } from '@/types/domain';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMyInvoices } from '@/hooks/useInvoices';
import { ApiError } from '@/lib/api/client';
import { invoicesApi } from '@/lib/api/invoices';
import { saveBlob } from '@/lib/invoices';
import type { Invoice } from '@/types/invoice';
import PaymentDetailModal from './PaymentDetailModal';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<PaymentRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRes | null>(null);
  // Giao dịch đã DUYỆT hoàn tiền nhưng tiền CHƯA chuyển: hiện "chờ chuyển" thay vì "Đã hoàn tiền" cho khớp trang Khiếu nại.
  const [awaitingTransfer, setAwaitingTransfer] = useState<Set<string>>(new Set());
  // Chứng từ của chính mình, ghép vào từng giao dịch theo mã đơn: biên lai (đơn đã thanh toán) và phiếu hoàn tiền (đơn đã hoàn xong).
  const { data: invoices } = useMyInvoices();
  const byOrder = useMemo(() => {
    const map = new Map<string, { receipt?: Invoice; refund?: Invoice }>();
    for (const inv of invoices ?? []) {
      if (inv.type !== 'RECEIPT' && inv.type !== 'REFUND') continue;
      for (const ref of inv.refs) {
        const entry = map.get(ref) ?? {};
        if (inv.type === 'RECEIPT') entry.receipt = inv;
        else entry.refund = inv;
        map.set(ref, entry);
      }
    }
    return map;
  }, [invoices]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const downloadInvoice = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      saveBlob(await invoicesApi.pdf(inv.id), `${inv.number}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được chứng từ. Vui lòng thử lại sau ít phút.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    paymentsApi
      .listMine()
      .then((data) => setPayments(data))
      .catch(() => toast.error('Lỗi khi tải lịch sử giao dịch'))
      .finally(() => setLoading(false));
    disputesApi
      .listMine()
      .then((ds) => setAwaitingTransfer(new Set(ds.filter((d) => d.refundTransferStatus === 'PENDING_TRANSFER' || d.refundTransferStatus === 'AWAITING_ACCOUNT').map((d) => d.paymentTxnRef))))
      .catch(() => undefined);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
        return 'bg-warning/10 text-ink border-warning/40';
      case 'FAILED':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'EXPIRED':
        return 'bg-ink-muted/10 text-ink-muted border-line';
      case 'REFUNDED':
        return 'bg-tint text-accent-dark border-accent/30';
      default:
        return 'bg-line text-ink border-line';
    }
  };

  const getStatusLabel = (status: string, txnRef?: string) => {
    if (status === 'REFUNDED' && txnRef && awaitingTransfer.has(txnRef)) return 'Đã duyệt hoàn · chờ chuyển';
    switch (status) {
      case 'PAID': return 'Thành công';
      case 'PENDING': return 'Đang chờ xử lý';
      case 'FAILED': return 'Thất bại';
      case 'EXPIRED': return 'Hết hạn';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  return (
    <div className="shell py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Lịch sử giao dịch</h1>
      <p className="mb-6 text-sm text-ink-muted">Mỗi giao dịch có biên lai điện tử và, nếu được hoàn tiền, phiếu hoàn tiền để bạn tải về ngay tại đây.</p>

      {loading ? (
        <div className="text-ink-muted">Đang tải dữ liệu...</div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          Bạn chưa có giao dịch nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink-muted">
            <thead className="bg-surface-raised text-xs uppercase text-ink">
              <tr>
                <th className="px-6 py-4">Mã tham chiếu (Hệ thống)</th>
                <th className="px-6 py-4">Mã GD Cổng thanh toán</th>
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Phương thức</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian thanh toán</th>
                <th className="px-6 py-4">Chứng từ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr 
                  key={p.txnRef} 
                  className="hover:bg-surface-raised transition-colors cursor-pointer"
                  onClick={() => setSelectedPayment(p)}
                >
                  <td className="px-6 py-4 font-mono font-medium text-ink">{p.txnRef}</td>
                  <td className="px-6 py-4 font-mono text-ink-muted text-sm">{p.gatewayTxnNo || 'Chưa có'}</td>
                  <td className="px-6 py-4 font-medium text-ink max-w-[200px] truncate" title={p.courseTitle}>
                    {p.courseTitle}
                  </td>
                  <td className="px-6 py-4 text-accent font-semibold">
                    {p.amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">{p.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status, p.txnRef)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1.5">
                      {[byOrder.get(p.txnRef)?.receipt, byOrder.get(p.txnRef)?.refund].map((inv) =>
                        inv ? (
                          <button
                            key={inv.id}
                            type="button"
                            disabled={downloadingId === inv.id}
                            onClick={() => downloadInvoice(inv)}
                            title={`Tải ${inv.type === 'REFUND' ? 'phiếu hoàn tiền' : 'biên lai'} ${inv.number} (PDF)`}
                            className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? 'Đang tải...' : inv.type === 'REFUND' ? 'Phiếu hoàn' : 'Biên lai'}
                          </button>
                        ) : null,
                      )}
                      {!byOrder.get(p.txnRef) && (p.status === 'PAID' || p.status === 'REFUNDED') && (
                        <span className="text-xs text-ink-muted" title="Biên lai được tạo sau khi thanh toán hoàn tất, thường trong vài phút">Đang tạo</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetailModal 
          payment={selectedPayment}
          awaitingTransfer={awaitingTransfer.has(selectedPayment.txnRef)}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
