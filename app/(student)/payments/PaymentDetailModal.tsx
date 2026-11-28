'use client';

import { Modal } from '@/components/ui/Modal';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { PaymentRes } from '@/types/domain';
import { format } from 'date-fns';

interface PaymentDetailModalProps {
  payment: PaymentRes;
  /** Đã duyệt hoàn tiền nhưng tiền chưa chuyển: hiện "chờ chuyển" thay vì "Đã hoàn tiền". */
  awaitingTransfer?: boolean;
  onClose: () => void;
}

export default function PaymentDetailModal({ payment, onClose, awaitingTransfer = false }: PaymentDetailModalProps) {
  const t = useTranslations('pages.paymentDetail');
  const tp = useTranslations('pages.payments');
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
      case 'PAID': return tp('statusPaid');
      case 'PENDING': return tp('statusPending');
      case 'FAILED': return tp('statusFailed');
      case 'EXPIRED': return tp('statusExpired');
      case 'REFUNDED': return awaitingTransfer ? tp('statusAwaiting') : tp('statusRefunded');
      default: return status;
    }
  };

  return (
    <Modal open onClose={onClose} title={t('title')} size="md">
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">{t('amount')}</p>
              <p className="text-3xl font-display font-bold text-accent">
                {payment.amount.toLocaleString('vi-VN')}đ
              </p>
              {payment.couponCode && payment.originalAmount != null && (
                <p className="mt-1 text-sm text-ink-muted">
                  <span className="line-through">{payment.originalAmount.toLocaleString('vi-VN')}đ</span>
                  {' '}{t('discounted', { amount: payment.discountAmount.toLocaleString('vi-VN') })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">{t('status')}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                {getStatusLabel(payment.status)}
              </span>
            </div>
          </div>

          {payment.couponCode && (
            <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-4 py-2.5">
              <span className="text-sm font-medium text-ink-muted">{t('couponUsed')}</span>
              <span className="font-mono font-bold text-accent-dark">{payment.couponCode}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-line pt-6">
            <div className="col-span-2">
              <p className="text-sm font-medium text-ink-muted mb-1">{t('course')}</p>
              <p className="font-medium text-ink text-lg">{payment.courseTitle}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('billingName')}</p>
              <p className="font-medium text-ink">{payment.billingName || t('none')}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('billingPhone')}</p>
              <p className="font-medium text-ink">{payment.billingPhone || t('none')}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('ref')}</p>
              <p className="font-mono text-sm text-ink bg-surface-raised px-2 py-1 rounded inline-block">{payment.txnRef}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('gatewayNo')}</p>
              <p className="font-mono text-sm text-ink">{payment.gatewayTxnNo || t('notYet')}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('method')}</p>
              <p className="font-medium text-ink">{payment.paymentMethod}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-muted mb-1">{t('paidAt')}</p>
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
                {t('report')}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-ink-muted" title={t('reportDisabled')}>
                {t('report')}
              </span>
            )}
            <Link
              href="/legal/refund"
              className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              {t('refundPolicy')}
            </Link>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
          >
            {t('close')}
          </button>
        </div>
    </Modal>
  );
}
