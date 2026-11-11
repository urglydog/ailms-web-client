'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import { paymentsApi } from '@/lib/api/payments';
import type { DisputeCategory, DisputeRes, PaymentRes } from '@/types/domain';

const STATUS_LABEL: Record<DisputeRes['status'], string> = {
  OPEN: 'Chưa xử lý',
  RESOLVED_REFUNDED: 'Đã hoàn tiền',
  RESOLVED_REJECTED: 'Đã từ chối',
  REOPENED: 'Đang chờ xử lý lại',
};
const STATUS_CLASS: Record<DisputeRes['status'], string> = {
  OPEN: 'bg-surface-raised text-ink border-warning',
  RESOLVED_REFUNDED: 'bg-success/10 text-success border-success/20',
  RESOLVED_REJECTED: 'bg-line text-ink-muted border-line',
  REOPENED: 'bg-danger/10 text-danger border-danger/30',
};
const CATEGORY_LABEL: Record<DisputeCategory, string> = {
  CHANGED_MIND: 'Tôi đổi ý / khóa học không phù hợp',
  CONTENT_MISMATCH: 'Nội dung khác với mô tả',
  TECHNICAL_ERROR: 'Lỗi kỹ thuật (không vào học được...)',
  DOUBLE_CHARGE: 'Bị trừ tiền hai lần',
  NOT_ENROLLED: 'Đã trừ tiền nhưng không được ghi danh',
  OTHER: 'Lý do khác',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as DisputeCategory[];
const MAX_FILES = 5;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
/** Phải khớp `lms.rules.dispute-reopen-window-days` ở BE (application.yml) — đây chỉ là ước
 * lượng hiển thị cho UI (ẩn/hiện nút), BE luôn là nơi validate thật khi gọi API. */
const REOPEN_WINDOW_DAYS = 7;

/** `useSearchParams()` bắt buộc nằm trong Suspense khi build production (bài học từ lần build
 * Vercel trước bị lỗi ở trang disputes admin vì thiếu bọc này). */
export default function RequestRefundPage() {
  return (
    <Suspense fallback={null}>
      <RequestRefundContent />
    </Suspense>
  );
}

function RequestRefundContent() {
  const searchParams = useSearchParams();
  const preselectedRef = searchParams.get('ref');

  const [payments, setPayments] = useState<PaymentRes[]>([]);
  const [myDisputes, setMyDisputes] = useState<DisputeRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRef, setSelectedRef] = useState<string | null>(preselectedRef);

  const [category, setCategory] = useState<DisputeCategory>('CHANGED_MIND');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [refundBankAccount, setRefundBankAccount] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reopeningId, setReopeningId] = useState<number | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([paymentsApi.listMine(), disputesApi.listMine()])
      .then(([p, d]) => {
        setPayments(p.filter((x) => x.status === 'PAID'));
        setMyDisputes(d);
      })
      .catch(() => toast.error('Không tải được dữ liệu giao dịch.'))
      .finally(() => setLoading(false));
  }, []);

  const selectedPayment = payments.find((p) => p.txnRef === selectedRef) ?? null;
  const alreadyDisputed = (txnRef: string) => myDisputes.some((d) => d.paymentTxnRef === txnRef);

  const canReopen = (d: DisputeRes) =>
    d.status === 'RESOLVED_REFUNDED' &&
    d.refundTransferStatus !== 'PENDING_TRANSFER' &&
    !d.reopenedAt &&
    d.resolvedAt != null &&
    Date.now() - new Date(d.resolvedAt).getTime() < REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const handleReopenSubmit = async (disputeId: number) => {
    if (!reopenReason.trim()) return;
    setReopenSubmitting(true);
    try {
      const updated = await disputesApi.reopen(disputeId, { reopenReason: reopenReason.trim() });
      setMyDisputes((prev) => prev.map((d) => (d.id === disputeId ? updated : d)));
      toast.success('Đã gửi yêu cầu xem xét lại, đội ngũ hỗ trợ sẽ xử lý sớm nhất.');
      setReopeningId(null);
      setReopenReason('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không gửi được yêu cầu, vui lòng thử lại.');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > MAX_FILES) {
      toast.error(`Chỉ được đính kèm tối đa ${MAX_FILES} file minh chứng.`);
      return;
    }
    setFiles(picked);
  };

  const resetForm = () => {
    setSelectedRef(null);
    setCategory('CHANGED_MIND');
    setReason('');
    setDescription('');
    setRefundBankAccount('');
    setFiles([]);
    setTermsAccepted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !reason.trim() || !termsAccepted) return;
    setSubmitting(true);
    setError(null);
    try {
      const filed = await disputesApi.file(
        {
          paymentTxnRef: selectedPayment.txnRef,
          reason: reason.trim(),
          description: description.trim() || undefined,
          refundBankAccount: refundBankAccount.trim() || undefined,
          termsAccepted,
          category,
        },
        files,
      );
      setMyDisputes((prev) => [filed, ...prev]);
      toast.success('Đã gửi khiếu nại. Chúng tôi sẽ phản hồi qua email sau khi xử lý xong.');
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được khiếu nại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="shell py-10 text-ink-muted">Đang tải...</div>;
  }

  return (
    <div className="shell flex flex-col gap-8 py-10">
      <div>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">Yêu cầu hoàn tiền / Khiếu nại giao dịch</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Chọn đúng giao dịch liên quan, mô tả vấn đề và đính kèm minh chứng nếu có. Vui lòng đọc{' '}
          <Link href="/legal/refund" className="text-accent-dark underline">chính sách hoàn tiền</Link> trước khi gửi.
        </p>
      </div>

      {!selectedPayment ? (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-lg font-bold text-ink">Chọn giao dịch cần khiếu nại</h2>
          {payments.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-ink-muted">
              Bạn chưa có giao dịch nào đã thanh toán thành công để khiếu nại.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {payments.map((p) => (
                <button
                  key={p.txnRef}
                  type="button"
                  disabled={alreadyDisputed(p.txnRef)}
                  onClick={() => setSelectedRef(p.txnRef)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised p-4 text-left hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{p.courseTitle}</div>
                    <div className="text-xs text-ink-muted">
                      Mã GD: <span className="font-mono">{p.txnRef}</span> · {p.amount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  {alreadyDisputed(p.txnRef) && (
                    <span className="shrink-0 rounded-full border border-warning bg-surface-raised px-2.5 py-1 text-xs font-semibold text-ink">
                      Đang có khiếu nại chờ xử lý
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-raised p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-ink">{selectedPayment.courseTitle}</div>
              <div className="text-xs text-ink-muted">
                Mã GD: <span className="font-mono">{selectedPayment.txnRef}</span> · {selectedPayment.amount.toLocaleString('vi-VN')}đ
              </div>
            </div>
            <button type="button" onClick={() => setSelectedRef(null)} className="text-sm font-semibold text-accent-dark hover:underline">
              Đổi giao dịch
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Loại vấn đề *</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                ))}
              </select>
              <span className="text-xs text-ink-muted">
                Hoàn tiền áp dụng trong thời hạn và mức tiến độ học theo chính sách; lỗi kỹ thuật được xét riêng.
                Giảng viên của khóa học sẽ được báo và có thể phản hồi trước khi chúng tôi quyết định.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Lý do *</span>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Bị trừ tiền nhưng không ghi danh được khóa học"
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Mô tả chi tiết</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Số tài khoản nhận hoàn tiền (nếu có)</span>
              <input
                type="text"
                value={refundBankAccount}
                onChange={(e) => setRefundBankAccount(e.target.value)}
                placeholder="VD: Vietcombank - 0123456789 - Nguyễn Văn A"
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Minh chứng (ảnh/video, tối đa {MAX_FILES} file)</span>
              <input
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={handleFilesChange}
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent file:mr-3 file:rounded-md file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-accent-dark"
              />
              {files.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-ink-muted">
                  {files.map((f) => (
                    <li key={f.name}>{f.name} ({(f.size / 1024 / 1024).toFixed(1)}MB)</li>
                  ))}
                </ul>
              )}
            </label>

            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" className="mt-0.5" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span>
                Tôi xác nhận các thông tin khai báo ở trên là đúng sự thật và đồng ý với{' '}
                <Link href="/legal/refund" target="_blank" className="text-accent-dark underline">chính sách hoàn tiền</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !reason.trim() || !termsAccepted}
              className="w-fit rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </form>
        </section>
      )}

      {myDisputes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-lg font-bold text-ink">Khiếu nại của tôi</h2>
          <div className="flex flex-col gap-2">
            {myDisputes.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{d.courseTitle}</div>
                    <div className="text-xs text-ink-muted">
                      Mã GD: <span className="font-mono">{d.paymentTxnRef}</span> — {d.reason}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>

                {d.category && (
                  <div className="text-xs text-ink-muted">Loại vấn đề: {CATEGORY_LABEL[d.category]}</div>
                )}

                {d.status === 'OPEN' && (
                  <div className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted">
                    {d.instructorDecision === 'AGREE_REFUND' && 'Giảng viên đã đồng ý hoàn tiền. '}
                    {d.instructorDecision === 'OBJECT' && 'Giảng viên đã gửi phản hồi. '}
                    Đang chờ đội ngũ hỗ trợ xem xét và quyết định.
                  </div>
                )}

                {d.status === 'RESOLVED_REFUNDED' && d.refundTransferStatus === 'PENDING_TRANSFER' && (
                  <div className="rounded-lg border border-accent/30 bg-tint px-3 py-2 text-xs text-ink">
                    Yêu cầu hoàn tiền đã được chấp nhận, quyền truy cập khóa học đã được thu hồi. Chúng tôi sẽ chuyển
                    khoản cho bạn và báo qua email/thông báo.
                  </div>
                )}
                {d.status === 'RESOLVED_REFUNDED' && d.refundTransferStatus === 'TRANSFERRED' && (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-ink">
                    Đã chuyển tiền hoàn cho bạn. Nếu chưa nhận được, bạn có thể báo lại bên dưới.
                  </div>
                )}

                {(d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_REJECTED') && d.adminNote && (
                  <div className="rounded-lg bg-surface px-3 py-2 text-sm text-ink">
                    <div className="mb-0.5 text-xs font-semibold text-ink-muted">Phản hồi từ đội ngũ hỗ trợ</div>
                    {d.adminNote}
                  </div>
                )}

                {canReopen(d) && reopeningId !== d.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setReopeningId(d.id);
                      setReopenReason('');
                    }}
                    className="w-fit text-sm font-semibold text-danger hover:text-danger-dark"
                  >
                    Tôi chưa nhận được tiền
                  </button>
                )}

                {reopeningId === d.id && (
                  <div className="flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-ink">Vui lòng mô tả rõ hơn (vd: ngân hàng, thời điểm kiểm tra)</span>
                      <textarea
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={reopenSubmitting || !reopenReason.trim()}
                        onClick={() => handleReopenSubmit(d.id)}
                        className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-dark disabled:opacity-50"
                      >
                        {reopenSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu xem xét lại'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReopeningId(null)}
                        className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
