'use client';

import type { PaymentRes } from '@/types/domain';
import { format } from 'date-fns';

interface PaymentDetailModalProps {
  payment: PaymentRes;
  onClose: () => void;
}

export default function PaymentDetailModal({ payment, onClose }: PaymentDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden border border-line">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-ink">Chi tiết giao dịch</h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Số tiền</p>
              <p className="text-3xl font-display font-bold text-accent">
                {payment.amount.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Trạng thái</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                {getStatusLabel(payment.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-line pt-6">
            <div className="col-span-2">
              <p className="text-sm font-medium text-ink-muted mb-1">Khóa học</p>
              <p className="font-medium text-ink text-lg">{payment.courseTitle}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Họ tên thanh toán</p>
              <p className="font-medium text-ink">{payment.billingName || 'Không có'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Số điện thoại</p>
              <p className="font-medium text-ink">{payment.billingPhone || 'Không có'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Mã tham chiếu (Hệ thống)</p>
              <p className="font-mono text-sm text-ink bg-surface-raised px-2 py-1 rounded inline-block">{payment.txnRef}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Mã GD (Cổng thanh toán)</p>
              <p className="font-mono text-sm text-ink">{payment.gatewayTxnNo || 'Chưa có'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Phương thức</p>
              <p className="font-medium text-ink">{payment.paymentMethod}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">Thời gian thanh toán</p>
              <p className="font-medium text-ink">{payment.paidAt ? format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm:ss') : '-'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-raised border-t border-line flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={() => alert('Tính năng Báo cáo vấn đề sẽ được ra mắt trong tương lai!')}
              className="text-sm font-semibold text-danger hover:text-danger-dark transition-colors"
            >
              Báo cáo vấn đề
            </button>
            <button
              onClick={() => alert('Chi tiết chính sách hoàn tiền xin xem trong Điều khoản sử dụng. Tính năng tự động hoàn tiền đang được phát triển.')}
              className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Yêu cầu hỗ trợ
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
