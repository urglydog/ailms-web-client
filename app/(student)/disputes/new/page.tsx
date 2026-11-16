'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { disputesApi } from '@/lib/api/disputes';
import { paymentsApi } from '@/lib/api/payments';
import { RefundAccountEditor } from '@/components/disputes/RefundAccountEditor';
import type { DisputeCategory, DisputeRes, PaymentRes } from '@/types/domain';
import type { PayoutBank } from '@/types/finance';

const STATUS_LABEL: Record<DisputeRes['status'], string> = {
  OPEN: 'Chưa xử lý',
  RESOLVED_REFUNDED: 'Đã hoàn tiền',
  RESOLVED_REJECTED: 'Đã từ chối',
  REOPENED: 'Đang chờ xử lý lại',
};
/**
 * Nhãn trạng thái cho học viên: "Đã hoàn tiền" CHỈ khi tiền đã thực sự được chuyển. Admin duyệt rồi mà chưa chuyển khoản thì phải nói rõ
 * "đã duyệt, chờ chuyển khoản" — nếu không học viên tưởng tiền đã về (bug 14/11/2026).
 */
function statusBadge(d: DisputeRes): { label: string; className: string } {
  if (d.status === 'RESOLVED_REFUNDED' && d.refundTransferStatus === 'PENDING_TRANSFER') {
    return { label: 'Đã duyệt · chờ chuyển tiền', className: 'bg-accent text-white border-accent' };
  }
  if (d.status === 'RESOLVED_REFUNDED' && d.refundTransferStatus === 'AWAITING_ACCOUNT') {
    return { label: 'Cần cập nhật tài khoản', className: 'bg-danger text-white border-danger' };
  }
  return { label: STATUS_LABEL[d.status], className: STATUS_CLASS[d.status] };
}
const STATUS_CLASS: Record<DisputeRes['status'], string> = {
  OPEN: 'bg-warning/20 text-ink border-warning',
  RESOLVED_REFUNDED: 'bg-success text-white border-success',
  RESOLVED_REJECTED: 'bg-line text-ink border-line',
  REOPENED: 'bg-danger/10 text-danger border-danger',
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

/** Bộ lọc trạng thái của danh sách "Yêu cầu của tôi" (16/11/2026). */
type StatusFilter = 'ALL' | 'PROCESSING' | 'AWAITING' | 'REFUNDED' | 'REJECTED';
const FILTER_LABEL: Record<StatusFilter, string> = {
  ALL: 'Tất cả',
  PROCESSING: 'Đang xử lý',
  AWAITING: 'Chờ chuyển tiền',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Bị từ chối',
};
const FILTERS = Object.keys(FILTER_LABEL) as StatusFilter[];

function filterKey(d: DisputeRes): Exclude<StatusFilter, 'ALL'> {
  if (d.status === 'OPEN' || d.status === 'REOPENED') return 'PROCESSING';
  if (d.status === 'RESOLVED_REJECTED') return 'REJECTED';
  if (d.refundTransferStatus === 'TRANSFERRED') return 'REFUNDED';
  return 'AWAITING';
}

/** Không phân biệt hoa/thường và dấu tiếng Việt, để gõ "ai agent" vẫn tìm ra "AI Agent". */
function norm(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

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
  // Hai khu vực tách bạch: tạo yêu cầu mới (chọn giao dịch) và danh sách yêu cầu đã tạo (có tìm kiếm + lọc trạng thái).
  const [tab, setTab] = useState<'create' | 'mine'>('create');
  const [paySearch, setPaySearch] = useState('');
  const [disputeSearch, setDisputeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [category, setCategory] = useState<DisputeCategory>('CHANGED_MIND');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  // Tài khoản nhận hoàn tiền (14/11/2026): khai báo có cấu trúc để hệ thống chuyển đúng, người khai chịu trách nhiệm về độ chính xác.
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountNumberAgain, setAccountNumberAgain] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [ownConfirmed, setOwnConfirmed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reopeningId, setReopeningId] = useState<number | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([paymentsApi.listMine(), disputesApi.listMine(), disputesApi.banks().catch(() => [] as PayoutBank[])])
      .then(([p, d, b]) => {
        setPayments(p.filter((x) => x.status === 'PAID'));
        setMyDisputes(d);
        setBanks(b);
        // Có yêu cầu rồi thì mở thẳng danh sách; đi từ liên kết "ref=" (từ trang thanh toán) thì mở form tạo mới.
        if (!preselectedRef && d.length > 0) setTab('mine');
      })
      .catch(() => toast.error('Không tải được dữ liệu giao dịch.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải một lần khi vào trang
  }, []);

  const digits = accountNumber.replace(/\s/g, '');
  const hasAccountInput = bankCode !== '' || accountNumber.trim() !== '' || accountNumberAgain.trim() !== '' || accountHolder.trim() !== '';
  const accountProblem = !hasAccountInput
    ? null
    : bankCode === ''
      ? 'Hãy chọn ngân hàng nhận hoàn tiền.'
      : !/^[0-9]{6,20}$/.test(digits)
        ? 'Số tài khoản chỉ gồm chữ số (6–20 số).'
        : accountNumberAgain.replace(/\s/g, '') !== digits
          ? 'Hai lần nhập số tài khoản chưa khớp nhau.'
          : accountHolder.trim().length < 2
            ? 'Hãy nhập tên chủ tài khoản.'
            : !ownConfirmed
              ? 'Bạn cần xác nhận đây là tài khoản của chính bạn.'
              : null;
  const accountIncomplete = accountProblem !== null;

  const selectedPayment = payments.find((p) => p.txnRef === selectedRef) ?? null;
  const alreadyDisputed = (txnRef: string) => myDisputes.some((d) => d.paymentTxnRef === txnRef);

  const canReopen = (d: DisputeRes) =>
    d.status === 'RESOLVED_REFUNDED' &&
    d.refundTransferStatus !== 'PENDING_TRANSFER' &&
    d.refundTransferStatus !== 'AWAITING_ACCOUNT' &&
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
    setBankCode('');
    setAccountNumber('');
    setAccountNumberAgain('');
    setAccountHolder('');
    setOwnConfirmed(false);
    setFiles([]);
    setTermsAccepted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !reason.trim() || !termsAccepted) return;
    if (accountIncomplete) {
      setError(accountProblem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const filed = await disputesApi.file(
        {
          paymentTxnRef: selectedPayment.txnRef,
          reason: reason.trim(),
          description: description.trim() || undefined,
          ...(hasAccountInput
            ? {
                refundBankCode: bankCode,
                refundAccountNumber: digits,
                refundAccountHolder: accountHolder.trim(),
                refundAccountOwnConfirmed: ownConfirmed,
              }
            : {}),
          termsAccepted,
          category,
        },
        files,
      );
      setMyDisputes((prev) => [filed, ...prev]);
      setTab('mine');
      toast.success('Đã gửi khiếu nại. Chúng tôi sẽ phản hồi qua email sau khi xử lý xong.');
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được khiếu nại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const payQuery = norm(paySearch.trim());
  const visiblePayments = payments.filter((p) => !payQuery || norm(`${p.courseTitle} ${p.txnRef}`).includes(payQuery));
  const disputeQuery = norm(disputeSearch.trim());
  const visibleDisputes = myDisputes.filter(
    (d) => (statusFilter === 'ALL' || filterKey(d) === statusFilter) && (!disputeQuery || norm(`${d.courseTitle} ${d.paymentTxnRef} ${d.reason}`).includes(disputeQuery)),
  );
  const filterCount = (f: StatusFilter) => (f === 'ALL' ? myDisputes.length : myDisputes.filter((d) => filterKey(d) === f).length);
  const needsAction = myDisputes.filter((d) => d.refundTransferStatus === 'AWAITING_ACCOUNT').length;

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

      <div role="tablist" aria-label="Khu vực yêu cầu hoàn tiền" className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-1.5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'create'}
          onClick={() => setTab('create')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${tab === 'create' ? 'bg-accent text-white shadow' : 'text-ink hover:bg-tint'}`}
        >
          Tạo yêu cầu mới
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          onClick={() => setTab('mine')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${tab === 'mine' ? 'bg-accent text-white shadow' : 'text-ink hover:bg-tint'}`}
        >
          Yêu cầu của tôi
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'mine' ? 'bg-white/20 text-white' : 'bg-line text-ink'}`}>{myDisputes.length}</span>
          {needsAction > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{needsAction} cần xử lý</span>}
        </button>
      </div>

      {tab === 'create' && (!selectedPayment ? (
        <section className="flex flex-col gap-3">
          <div className="rounded-xl border-l-4 border-accent bg-tint px-4 py-3">
            <h2 className="m-0 font-display text-lg font-bold text-ink">Tạo yêu cầu mới — chọn giao dịch</h2>
            <p className="m-0 mt-0.5 text-xs text-ink-muted">Chỉ hiển thị các giao dịch đã thanh toán thành công. Chọn một giao dịch để điền thông tin yêu cầu.</p>
          </div>
          {payments.length > 0 && (
            <input
              type="search"
              value={paySearch}
              onChange={(e) => setPaySearch(e.target.value)}
              placeholder="Tìm theo tên khóa học hoặc mã giao dịch"
              aria-label="Tìm giao dịch"
              className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          )}
          {payments.length > 0 && visiblePayments.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">Không có giao dịch nào phù hợp với từ khóa.</div>
          )}
          {payments.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-ink-muted">
              Bạn chưa có giao dịch nào đã thanh toán thành công để khiếu nại.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visiblePayments.map((p) => (
                <button
                  key={p.txnRef}
                  type="button"
                  disabled={alreadyDisputed(p.txnRef)}
                  onClick={() => setSelectedRef(p.txnRef)}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-line bg-surface-raised p-4 text-left hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
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

            <fieldset className="m-0 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Tài khoản nhận hoàn tiền (nên điền)</legend>
              <p className="m-0 text-xs text-ink-muted">
                Khoản hoàn được chuyển đúng theo thông tin bạn khai. Hãy nhập thật cẩn thận: nếu số tài khoản sai mà vẫn là một tài khoản có thật,
                tiền sẽ chuyển tới người khác và khó thu hồi. Không điền ở bước này thì bạn cần liên hệ hỗ trợ để bổ sung trước khi nhận tiền.
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">Ngân hàng</span>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">Chọn ngân hàng</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">Số tài khoản</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={25}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-raised p-2.5 font-mono text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink">Nhập lại số tài khoản</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={25}
                    value={accountNumberAgain}
                    onChange={(e) => setAccountNumberAgain(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    className="w-full rounded-lg border border-line bg-surface-raised p-2.5 font-mono text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">Tên chủ tài khoản</span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={100}
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" checked={ownConfirmed} onChange={(e) => setOwnConfirmed(e.target.checked)} className="mt-1" />
                <span>Tôi xác nhận đây là tài khoản của chính tôi, thông tin đã đúng và tôi chịu trách nhiệm về độ chính xác của nó.</span>
              </label>
              {hasAccountInput && accountProblem && <p className="m-0 text-xs text-danger">{accountProblem}</p>}
            </fieldset>

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
      ))}

      {tab === 'mine' && (
        <section className="flex flex-col gap-3">
          <div className="rounded-xl border-l-4 border-accent bg-tint px-4 py-3">
            <h2 className="m-0 font-display text-lg font-bold text-ink">Yêu cầu của tôi</h2>
            <p className="m-0 mt-0.5 text-xs text-ink-muted">Theo dõi trạng thái các yêu cầu hoàn tiền bạn đã tạo.</p>
          </div>
          {myDisputes.length > 0 && (
            <>
              <input
                type="search"
                value={disputeSearch}
                onChange={(e) => setDisputeSearch(e.target.value)}
                placeholder="Tìm theo khóa học, mã giao dịch hoặc lý do"
                aria-label="Tìm yêu cầu"
                className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={statusFilter === f}
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f ? 'border-accent bg-accent text-white' : 'border-line bg-surface-raised text-ink hover:border-accent'}`}
                  >
                    {FILTER_LABEL[f]} ({filterCount(f)})
                  </button>
                ))}
              </div>
            </>
          )}
          {myDisputes.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">
              Bạn chưa tạo yêu cầu nào.{' '}
              <button type="button" onClick={() => setTab('create')} className="font-semibold text-accent-dark underline">Tạo yêu cầu mới</button>
            </div>
          )}
          {myDisputes.length > 0 && visibleDisputes.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">Không có yêu cầu nào phù hợp với bộ lọc.</div>
          )}
          <div className="flex flex-col gap-3">
            {visibleDisputes.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 rounded-xl border-2 border-line bg-surface-raised p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{d.courseTitle}</div>
                    <div className="text-xs text-ink-muted">
                      Mã GD: <span className="font-mono">{d.paymentTxnRef}</span> — {d.reason}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(d).className}`}>
                    {statusBadge(d).label}
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
                    Yêu cầu hoàn tiền đã được chấp nhận, quyền truy cập khóa học đã được thu hồi. Hệ thống sẽ chi
                    trả khoản hoàn vào tài khoản bạn đã khai và báo lại qua email/thông báo khi hoàn tất.
                  </div>
                )}
                {d.status === 'RESOLVED_REFUNDED' && (d.refundTransferStatus === 'PENDING_TRANSFER' || d.refundTransferStatus === 'AWAITING_ACCOUNT') && (
                  <RefundAccountEditor
                    dispute={d}
                    onUpdated={(updated) => setMyDisputes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                  />
                )}
                {d.status === 'RESOLVED_REFUNDED' && d.refundTransferStatus === 'TRANSFERRED' && (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-ink">
                    {`Khoản hoàn tiền đã được chuyển vào ${d.refundAccountSummary ? `tài khoản ${d.refundAccountSummary}` : 'tài khoản bạn đã đăng ký'}. Nếu chưa nhận được, bạn có thể báo lại bên dưới.`}
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
