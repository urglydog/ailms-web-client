'use client';

import { Modal } from '@/components/ui/Modal';

import Link from 'next/link';
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

  const getStatusLabel = (status: string) => {
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
    <Modal open onClose={onClose} title="Chi tiết giao dịch" size="md">
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Số tiền</p>
              <p className="text-3xl font-display font-bold text-accent">
                {payment.amount.toLocaleString('vi-VN')}đ
              </p>
              {payment.couponCode && payment.originalAmount != null && (
                <p className="mt-1 text-sm text-ink-muted">
                  <span className="line-through">{payment.originalAmount.toLocaleString('vi-VN')}đ</span>
                  {' '}— đã giảm {payment.discountAmount.toLocaleString('vi-VN')}đ
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Trạng thái</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                {getStatusLabel(payment.status)}
              </span>
            </div>
          </div>

          {payment.couponCode && (
            <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-4 py-2.5">
              <span className="text-sm font-medium text-ink-muted">Mã giảm giá đã dùng</span>
              <span className="font-mono font-bold text-accent-dark">{payment.couponCode}</span>
            </div>
          )}

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

        <div className="-mx-6 -mb-6 mt-6 flex items-center justify-between border-t border-line-soft bg-tint/40 px-6 py-4">
          <div className="flex gap-3">
            {payment.status === 'PAID' ? (
              <Link
                href={`/disputes/new?ref=${payment.txnRef}`}
                className="text-sm font-semibold text-danger hover:text-danger-dark transition-colors"
              >
                Báo cáo vấn đề
              </Link>
            ) : (
              <span className="text-sm font-semibold text-ink-muted" title="Chỉ khiếu nại được giao dịch đã thanh toán thành công">
                Báo cáo vấn đề
              </span>
            )}
            <Link
              href="/legal/refund"
              className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Chính sách hoàn tiền
            </Link>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
          >
            Đóng
          </button>
        </div>
    </Modal>
  );
}
