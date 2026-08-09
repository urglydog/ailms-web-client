'use client';

import { useEffect, useState } from 'react';
import { paymentsApi } from '@/lib/api/payments';
import type { PaymentRes } from '@/types/domain';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PaymentDetailModal from './PaymentDetailModal';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<PaymentRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRes | null>(null);

  useEffect(() => {
    paymentsApi
      .listMine()
      .then((data) => setPayments(data))
      .catch(() => toast.error('Lỗi khi tải lịch sử giao dịch'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'FAILED':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'EXPIRED':
        return 'bg-ink-muted/10 text-ink-muted border-line';
      default:
        return 'bg-line text-ink border-line';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Thành công';
      case 'PENDING': return 'Đang chờ xử lý';
      case 'FAILED': return 'Thất bại';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  };

  return (
    <div className="shell py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Lịch sử giao dịch</h1>
      
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
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm') : '-'}
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
          onClose={() => setSelectedPayment(null)} 
        />
      )}
    </div>
  );
}
