'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DebtsPanel } from '@/components/admin/finance/DebtsPanel';
import { PayoutPayosControls } from '@/components/admin/finance/PayoutPayosControls';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { useDebounce } from '@/hooks/useDebounce';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { payosPayoutApi } from '@/lib/api/payosPayout';
import { adminPayoutsApi } from '@/lib/api/finance';
import { PAYOUT_STATUS_CLASS, dateOnly, dateTime, money } from '@/lib/finance';
import { getAccessToken } from '@/lib/auth/token';
import type { AccountReveal, AdminPayout, PayoutStatus } from '@/types/finance';

const PAYOUT_PAGE = 30;
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
  const t = useTranslations('admin.payouts');
  const queryClient = useQueryClient();
  // Hàng chờ duyệt hiện sẵn (ít, cần xử lý ngay); các yêu cầu đã xử lý chỉ hiện khi chọn trạng thái hoặc tìm kiếm.
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'ALL'>('REQUESTED');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [limit, setLimit] = useState(PAYOUT_PAGE);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [text, setText] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'payouts', statusFilter, debouncedSearch, limit],
    queryFn: () => adminPayoutsApi.list(statusFilter === 'ALL' ? undefined : statusFilter, debouncedSearch, limit),
    enabled: !!getAccessToken(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : t('toast.failed'));
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
  // Yêu cầu có lệnh PayOS đang chạy: khóa các nút chuyển tay/từ chối/thất bại để không chi hai lần hoặc trả tiền về số dư khi PayOS vẫn đang chuyển.
  const [inFlightIds, setInFlightIds] = useState<Set<number>>(new Set());
  const [manualOpen, setManualOpen] = useState<Set<number>>(new Set());
  const toggleManual = (id: number) =>
    setManualOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setInFlight = (id: number, on: boolean) =>
    setInFlightIds((prev) => {
      if (prev.has(id) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const approve = useMutation({
    mutationFn: (id: number) => adminPayoutsApi.approve(id),
    onSuccess: () => { toast.success(t('toast.approved')); refresh(); },
    onError,
  });
  const markPaid = useMutation({
    mutationFn: (v: { id: number; ref: string; proof: string }) => adminPayoutsApi.markPaid(v.id, v.ref, v.proof),
    onSuccess: () => { toast.success(t('toast.paid')); closeDialog(); refresh(); },
    onError,
  });
  const reject = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPayoutsApi.reject(v.id, v.reason),
    onSuccess: () => { toast.success(t('toast.rejected')); closeDialog(); refresh(); },
    onError,
  });
  const fail = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPayoutsApi.markFailed(v.id, v.reason),
    onSuccess: () => { toast.success(t('toast.markedFailed')); closeDialog(); refresh(); },
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
  const busy = approve.isPending || markPaid.isPending || reject.isPending || fail.isPending || reveal.isPending;

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
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <DebtsPanel />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-64">
          <span className="text-xs font-semibold text-ink-muted">{t('search')}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(PAYOUT_PAGE);
            }}
            placeholder={t('searchPh')}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-64">
          <span className="text-xs font-semibold text-ink-muted">{t('statusLabel')}</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PayoutStatus | 'ALL');
              setLimit(PAYOUT_PAGE);
            }}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="ALL">{t('all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={exportCsv.isPending}
          onClick={() => exportCsv.mutate()}
          title={t('exportHint')}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
        >
          {t('export')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">{t('loadError')}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">{t('empty')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('cols.code')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.instructor')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.account')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('cols.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('cols.time')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('cols.actions')}</th>
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
                      <div className="mt-1 text-xs font-semibold text-danger">{t('nameMismatch')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{money(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${PAYOUT_STATUS_CLASS[p.status]}`}>
                      {t(`status.${p.status}`)}
                    </span>
                    {p.transferRef && <div className="mt-1 text-xs text-ink-muted">{t('transferRef', { ref: p.transferRef })}</div>}
                    {p.rejectReason && <div className="mt-1 text-xs text-danger">{p.rejectReason}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                    <div>{t('created', { at: dateTime(p.createdAt) })}</div>
                    {p.scheduledFor && <div>{t('batch', { at: dateOnly(p.scheduledFor) })}</div>}
                    {p.paidAt && <div>{t('paidAt', { at: dateTime(p.paidAt) })}</div>}
                  </td>
                  <td className="w-72 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-end gap-1.5">
                      {p.status === 'REQUESTED' && (
                        <button type="button" disabled={busy} onClick={() => approve.mutate(p.id)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                          {t('approve')}
                        </button>
                      )}
                      {p.status === 'APPROVED' && (
                        <>
                          <button type="button" disabled={busy} onClick={() => reveal.mutate(p)} className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50">
                            {t('reveal')}
                          </button>
                          {payosStatus?.enabled && (
                            <PayoutPayosControls
                              payoutId={p.id}
                              amount={p.amount}
                              status={payosStatus}
                              disabled={busy}
                              onInFlightChange={setInFlight}
                              onChanged={refresh}
                            />
                          )}
                          {/* Khi PayOS bật: "Đã chuyển"/"Thất bại" là việc thủ công, gom vào một mục thu gọn cho khỏi rối. */}
                          {payosStatus?.enabled && (
                            <button
                              type="button"
                              aria-expanded={manualOpen.has(p.id)}
                              onClick={() => toggleManual(p.id)}
                              className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                            >
                              {t('manual')} <span aria-hidden>{manualOpen.has(p.id) ? '▴' : '▾'}</span>
                            </button>
                          )}
                          {(!payosStatus?.enabled || manualOpen.has(p.id)) && (
                            <>
                              <button type="button" disabled={busy || inFlightIds.has(p.id)} onClick={() => setDialog({ kind: 'paid', payout: p })} className="whitespace-nowrap rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                                {t('markPaid')}
                              </button>
                              <button type="button" disabled={busy || inFlightIds.has(p.id)} onClick={() => setDialog({ kind: 'fail', payout: p })} className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50">
                                {t('markFailed')}
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {(p.status === 'REQUESTED' || p.status === 'APPROVED') && (
                        <button type="button" disabled={busy || inFlightIds.has(p.id)} onClick={() => setDialog({ kind: 'reject', payout: p })} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50">
                          {t('reject')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= limit && (
            <div className="flex justify-center border-t border-line p-3">
              <button type="button" onClick={() => setLimit((n) => n + PAYOUT_PAGE)} className="rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
                {t('more')}
              </button>
            </div>
          )}
        </div>
      )}

      {dialog && dialog.kind === 'reveal' && (
        <Modal open onClose={closeDialog} title={t('revealDlg.title')} size="sm" closeOnBackdrop={false}>
          <div className="flex flex-col gap-3 text-sm">
            <dl className="m-0 flex flex-col gap-2">
              <div><dt className="text-ink-muted">{t('revealDlg.bank')}</dt><dd className="m-0 font-semibold text-ink">{dialog.data.bankName}</dd></div>
              <div><dt className="text-ink-muted">{t('revealDlg.number')}</dt><dd className="m-0 font-mono text-lg font-bold text-ink">{dialog.data.accountNumber}</dd></div>
              <div><dt className="text-ink-muted">{t('revealDlg.holder')}</dt><dd className="m-0 font-semibold text-ink">{dialog.data.holderName}</dd></div>
              <div><dt className="text-ink-muted">{t('revealDlg.amount')}</dt><dd className="m-0 font-semibold text-ink">{money(dialog.payout.amount)}</dd></div>
              <div><dt className="text-ink-muted">{t('revealDlg.memo')}</dt><dd className="m-0 font-mono text-ink">LINGUALEARN {dialog.payout.code}</dd></div>
            </dl>
            <p className="m-0 text-xs text-ink-muted">{t('revealDlg.audit')}</p>
          </div>
        </Modal>
      )}

      {dialog && dialog.kind !== 'reveal' && (
        <Modal
          open
          onClose={closeDialog}
          size="sm"
          closeOnBackdrop={false}
          title={dialog.kind === 'paid' ? t('dlg.paidTitle') : dialog.kind === 'reject' ? t('dlg.rejectTitle') : t('dlg.failTitle')}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeDialog} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">{t('dlg.cancel')}</button>
              <button
                type="button"
                disabled={busy || !text.trim()}
                onClick={submitDialog}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {t('dlg.confirm')}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <p className="m-0 text-ink-muted">
              {dialog.payout.code} · {dialog.payout.instructorName} · {money(dialog.payout.amount)}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold text-ink">{dialog.kind === 'paid' ? t('dlg.refLabel') : t('dlg.reasonLabel')}</span>
              {dialog.kind === 'paid' ? (
                <input type="text" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              ) : (
                <textarea value={text} maxLength={500} rows={3} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              )}
            </label>
            {dialog.kind === 'paid' && (
              <label className="flex flex-col gap-1.5">
                <span className="font-semibold text-ink">{t('dlg.proofLabel')}</span>
                <input type="text" value={proofUrl} maxLength={500} onChange={(e) => setProofUrl(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
              </label>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
