'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { payosPayoutApi } from '@/lib/api/payosPayout';
import { adminPayoutsApi } from '@/lib/api/finance';
import { PAYOUT_STATUS_CLASS, PAYOUT_STATUS_LABEL, dateOnly, dateTime, money } from '@/lib/finance';
import { getAccessToken } from '@/lib/auth/token';
import type { AccountReveal, AdminPayout, PayoutStatus } from '@/types/finance';

const STATUSES: PayoutStatus[] = ['REQUESTED', 'APPROVED', 'PAID', 'PENDING_EMAIL', 'REJECTED', 'FAILED', 'CANCELLED'];
type Dialog =
  | { kind: 'paid'; payout: AdminPayout }
  | { kind: 'reject'; payout: AdminPayout }
  | { kind: 'fail'; payout: AdminPayout }
  | { kind: 'reveal'; payout: AdminPayout; data: AccountReveal };

/**
 * Chi trả giảng viên (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn C): duyệt yêu cầu rút, chuyển khoản tay rồi ghi mã
 * giao dịch, từ chối/đánh dấu thất bại (trả lại số dư cho giảng viên). Số tài khoản đầy đủ chỉ hiện khi bấm "Xem số TK" và mỗi
 * lần xem/xuất CSV đều được BE ghi nhật ký kiểm toán.
 */
export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'ALL'>('REQUESTED');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [text, setText] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'payouts', statusFilter],
    queryFn: () => adminPayoutsApi.list(statusFilter === 'ALL' ? undefined : statusFilter),
    enabled: !!getAccessToken(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Thao tác không thành công.');
  const closeDialog = () => {
    setDialog(null);
    setText('');
    setProofUrl('');
  };

  // Chi tự động qua PayOS: chỉ hiện nút khi công tắc bật; số tiền/tài khoản do máy chủ lấy từ DB.
  const { data: payosStatus } = useQuery({
    queryKey: ['admin', 'payos-payout', 'status'],
    queryFn: () => payosPayoutApi.status(),
    enabled: !!getAccessToken(),
    retry: false,
  });
  const autoTransfer = useMutation({
    mutationFn: (id: number) => payosPayoutApi.transferPayout(id),
    onSuccess: (order) => {
      toast.success(
        order.status === 'SUCCEEDED'
          ? 'PayOS đã chi và đã ghi nhận.'
          : order.status === 'FAILED'
            ? `PayOS từ chối: ${order.errorMessage ?? 'không rõ lý do'}`
            : 'Đã gửi lệnh chi sang PayOS, hệ thống sẽ tự cập nhật khi có kết quả.',
      );
      refresh();
    },
    onError,
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminPayoutsApi.approve(id),
    onSuccess: () => { toast.success('Đã duyệt yêu cầu.'); refresh(); },
    onError,
  });
  const markPaid = useMutation({
    mutationFn: (v: { id: number; ref: string; proof: string }) => adminPayoutsApi.markPaid(v.id, v.ref, v.proof),
    onSuccess: () => { toast.success('Đã ghi nhận chuyển khoản và báo cho giảng viên.'); closeDialog(); refresh(); },
    onError,
  });
  const reject = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPayoutsApi.reject(v.id, v.reason),
    onSuccess: () => { toast.success('Đã từ chối, số tiền được trả lại cho giảng viên.'); closeDialog(); refresh(); },
    onError,
  });
  const fail = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPayoutsApi.markFailed(v.id, v.reason),
    onSuccess: () => { toast.success('Đã đánh dấu thất bại, số tiền được trả lại cho giảng viên.'); closeDialog(); refresh(); },
    onError,
  });
  const reveal = useMutation({
    mutationFn: (p: AdminPayout) => adminPayoutsApi.reveal(p.id).then((d) => ({ p, d })),
    onSuccess: ({ p, d }) => setDialog({ kind: 'reveal', payout: p, data: d }),
    onError,
  });
  const exportCsv = useMutation({
    mutationFn: () => adminPayoutsApi.exportCsv(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payouts-approved.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError,
  });

  const rows = useMemo(() => data ?? [], [data]);
  const busy = autoTransfer.isPending || approve.isPending || markPaid.isPending || reject.isPending || fail.isPending || reveal.isPending;

  const submitDialog = () => {
    if (!dialog || dialog.kind === 'reveal') return;
    const id = dialog.payout.id;
    if (dialog.kind === 'paid') markPaid.mutate({ id, ref: text.trim(), proof: proofUrl.trim() });
    if (dialog.kind === 'reject') reject.mutate({ id, reason: text.trim() });
    if (dialog.kind === 'fail') fail.mutate({ id, reason: text.trim() });
  };

  return (
    <>
      <PageHeader
        title="Chi trả giảng viên"
        subtitle="Duyệt yêu cầu rút tiền, chuyển khoản tay rồi ghi mã giao dịch. Từ chối hoặc thất bại sẽ trả tiền về số dư của giảng viên."
      />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-64">
          <span className="text-xs font-semibold text-ink-muted">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PayoutStatus | 'ALL')}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{PAYOUT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={exportCsv.isPending}
          onClick={() => exportCsv.mutate()}
          title="Tải CSV các yêu cầu đã duyệt để chuyển khoản hàng loạt (có số tài khoản đầy đủ, được ghi nhật ký)"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
        >
          Xuất CSV đã duyệt
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">Không tải được danh sách.</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Không có yêu cầu nào.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã</th>
                <th className="px-4 py-3 font-semibold">Giảng viên</th>
                <th className="px-4 py-3 font-semibold">Tài khoản nhận</th>
                <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Thời gian</th>
                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map((p) => (
                <tr key={p.id} className="align-top hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{p.code}</td>
                  <td className="px-4 py-3 text-ink">
                    <div className="font-medium">{p.instructorName}</div>
                    <div className="text-xs text-ink-muted">{p.instructorEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <div>{p.bankName} {p.accountMask}</div>
                    <div className="text-xs text-ink-muted">{p.holderName}</div>
                    {!p.nameMatches && (
                      <div className="mt-1 text-xs font-semibold text-danger">Tên chủ TK không khớp tên giảng viên — kiểm tra kỹ</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{money(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${PAYOUT_STATUS_CLASS[p.status]}`}>
                      {PAYOUT_STATUS_LABEL[p.status]}
                    </span>
                    {p.transferRef && <div className="mt-1 text-xs text-ink-muted">Mã CK: {p.transferRef}</div>}
                    {p.rejectReason && <div className="mt-1 text-xs text-danger">{p.rejectReason}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                    <div>Tạo: {dateTime(p.createdAt)}</div>
                    {p.scheduledFor && <div>Đợt chi: {dateOnly(p.scheduledFor)}</div>}
                    {p.paidAt && <div>Chi: {dateTime(p.paidAt)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {p.status === 'REQUESTED' && (
                        <button type="button" disabled={busy} onClick={() => approve.mutate(p.id)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                          Duyệt
                        </button>
                      )}
                      {p.status === 'APPROVED' && (
                        <>
                          <button type="button" disabled={busy} onClick={() => reveal.mutate(p)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50">
                            Xem số TK
                          </button>
                          {payosStatus?.enabled && (
                            <button
                              type="button"
                              disabled={busy}
                              title={`Gửi lệnh chuyển ${money(p.amount)} qua PayOS. Số dư tài khoản chi: ${payosStatus.balance === null ? 'không rõ' : money(payosStatus.balance)}`}
                              onClick={() => autoTransfer.mutate(p.id)}
                              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                            >
                              Chi qua PayOS
                            </button>
                          )}
                          <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'paid', payout: p })} className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                            Đã chuyển
                          </button>
                          <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'fail', payout: p })} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50">
                            Thất bại
                          </button>
                        </>
                      )}
                      {(p.status === 'REQUESTED' || p.status === 'APPROVED') && (
                        <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'reject', payout: p })} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50">
                          Từ chối
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && dialog.kind === 'reveal' && (
        <Modal open onClose={closeDialog} title="Số tài khoản nhận tiền" size="sm" closeOnBackdrop={false}>
          <div className="flex flex-col gap-3 text-sm">
            <dl className="m-0 flex flex-col gap-2">
              <div><dt className="text-ink-muted">Ngân hàng</dt><dd className="m-0 font-semibold text-ink">{dialog.data.bankName}</dd></div>
              <div><dt className="text-ink-muted">Số tài khoản</dt><dd className="m-0 font-mono text-lg font-bold text-ink">{dialog.data.accountNumber}</dd></div>
              <div><dt className="text-ink-muted">Chủ tài khoản</dt><dd className="m-0 font-semibold text-ink">{dialog.data.holderName}</dd></div>
              <div><dt className="text-ink-muted">Số tiền</dt><dd className="m-0 font-semibold text-ink">{money(dialog.payout.amount)}</dd></div>
              <div><dt className="text-ink-muted">Nội dung chuyển khoản gợi ý</dt><dd className="m-0 font-mono text-ink">LINGUALEARN {dialog.payout.code}</dd></div>
            </dl>
            <p className="m-0 text-xs text-ink-muted">Lượt xem này đã được ghi vào nhật ký kiểm toán. Không chia sẻ số tài khoản ra ngoài.</p>
          </div>
        </Modal>
      )}

      {dialog && dialog.kind !== 'reveal' && (
        <Modal
          open
          onClose={closeDialog}
          size="sm"
          closeOnBackdrop={false}
          title={dialog.kind === 'paid' ? 'Ghi nhận đã chuyển khoản' : dialog.kind === 'reject' ? 'Từ chối yêu cầu rút' : 'Chuyển khoản thất bại'}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeDialog} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Hủy</button>
              <button
                type="button"
                disabled={busy || !text.trim()}
                onClick={submitDialog}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <p className="m-0 text-ink-muted">
              {dialog.payout.code} · {dialog.payout.instructorName} · {money(dialog.payout.amount)}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold text-ink">{dialog.kind === 'paid' ? 'Mã giao dịch chuyển khoản *' : 'Lý do * (giảng viên sẽ nhận được nội dung này)'}</span>
              {dialog.kind === 'paid' ? (
                <input type="text" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              ) : (
                <textarea value={text} maxLength={500} rows={3} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              )}
            </label>
            {dialog.kind === 'paid' && (
              <label className="flex flex-col gap-1.5">
                <span className="font-semibold text-ink">Liên kết ảnh chứng từ (không bắt buộc)</span>
                <input type="text" value={proofUrl} maxLength={500} onChange={(e) => setProofUrl(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              </label>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
