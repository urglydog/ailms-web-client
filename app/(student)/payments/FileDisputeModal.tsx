'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';

interface FileDisputeModalProps {
  paymentTxnRef: string;
  onClose: () => void;
  onFiled: () => void;
}

/** Form báo cáo vấn đề/khiếu nại giao dịch — thay cho `alert(...)` cũ, gọi thật `POST /api/v1/disputes`. */
export default function FileDisputeModal({ paymentTxnRef, onClose, onFiled }: FileDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [refundBankAccount, setRefundBankAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await disputesApi.file({
        paymentTxnRef,
        reason: reason.trim(),
        description: description.trim() || undefined,
        refundBankAccount: refundBankAccount.trim() || undefined,
      });
      toast.success('Đã gửi khiếu nại. Chúng tôi sẽ xử lý và thông báo kết quả cho bạn.');
      onFiled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được khiếu nại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="m-0 font-display text-lg font-bold text-ink">Báo cáo vấn đề giao dịch</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {error && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Lý do *</span>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Bị trừ tiền nhưng không ghi danh được khóa học"
              className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Mô tả chi tiết</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Số tài khoản nhận hoàn tiền (nếu có)</span>
            <input
              type="text"
              value={refundBankAccount}
              onChange={(e) => setRefundBankAccount(e.target.value)}
              placeholder="VD: Vietcombank - 0123456789 - Nguyễn Văn A"
              className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
              Hủy
            </button>
            <button type="submit" disabled={submitting || !reason.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
