'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pager } from '@/components/ui/SearchPanel';
import { useListControls } from '@/hooks/useListControls';
import { useCancelPayout, useChangePayoutAccount, useMyPayouts, usePayoutAccounts } from '@/hooks/useFinance';
import { useMyInvoices } from '@/hooks/useInvoices';
import { invoicesApi } from '@/lib/api/invoices';
import { saveBlob } from '@/lib/invoices';
import { ApiError } from '@/lib/api/client';
import { PAYOUT_STATUS_CLASS, dateOnly, dateTime, money } from '@/lib/finance';

/** Lịch sử yêu cầu rút tiền; còn hủy được khi chưa được admin duyệt. */
export function PayoutHistory() {
  const t = useTranslations('instructor.payoutHistory');
  const tFin = useTranslations('finance');
  const { data, isLoading } = useMyPayouts();
  // Lọc theo trạng thái + tìm theo mã yêu cầu, phân trang 5 yêu cầu mỗi trang (danh sách của chính giảng viên nên lọc ở trình duyệt).
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'CLOSED'>('ALL');
  const list = useListControls(data, {
    pageSize: 5,
    filter: (p) =>
      statusFilter === 'ALL' ? true : statusFilter === 'PAID' ? p.status === 'PAID' : statusFilter === 'PENDING' ? ['PENDING_EMAIL', 'REQUESTED', 'APPROVED'].includes(p.status) : ['REJECTED', 'FAILED', 'CANCELLED'].includes(p.status),
    match: (p, q) => p.code.toLowerCase().includes(q) || (p.transferRef ?? '').toLowerCase().includes(q),
  });
  const cancel = useCancelPayout();
  const change = useChangePayoutAccount();
  const { data: accounts } = usePayoutAccounts();
  const active = (accounts ?? []).filter((a) => a.status === 'ACTIVE');
  // Phiếu chi của từng yêu cầu rút (gắn theo mã yêu cầu), tải ngay tại dòng.
  const { data: invoices } = useMyInvoices();
  const voucherByCode = new Map((invoices ?? []).filter((i) => i.type === 'PAYOUT').flatMap((i) => i.refs.map((r) => [r, i] as const)));
  const downloadVoucher = async (id: number, number: string) => {
    try {
      saveBlob(await invoicesApi.pdf(id), `${number}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('loadError'));
    }
  };
  // Yêu cầu đang đổi tài khoản (mở khung chọn ngay trong dòng, không popup) và lựa chọn tạm.
  const [changingId, setChangingId] = useState<number | null>(null);
  const [pickedAccountId, setPickedAccountId] = useState<number | null>(null);

  const handleCancel = (id: number) => {
    cancel.mutate(id, {
      onSuccess: () => toast.success(t('cancelled')),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : t('cancelFailed')),
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-base font-bold text-ink">{t('title')}</h2>
        {data && data.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label={t('searchAria')}
              value={list.query}
              onChange={(e) => list.setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <select
              aria-label={t('filterAria')}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'PAID' | 'CLOSED');
                list.setPage(0);
              }}
              className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="ALL">{t('filter.all')}</option>
              <option value="PENDING">{t('filter.pending')}</option>
              <option value="PAID">{t('filter.paid')}</option>
              <option value="CLOSED">{t('filter.closed')}</option>
            </select>
          </div>
        )}
      </div>
      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">{t('loading')}</p>
      ) : !data || data.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{t('empty')}</p>
      ) : list.total === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{t('noMatch')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {list.pageItems.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-xs text-ink-muted">{p.code}</span>
                <span className="font-semibold text-ink">{money(p.amount)}</span>
                <span className="text-xs text-ink-muted">
                  {p.bankName} {p.accountMask} · {dateTime(p.createdAt)}
                  {p.scheduledFor && p.status === 'REQUESTED' ? t('scheduled', { date: dateOnly(p.scheduledFor) }) : ''}
                  {p.transferRef ? t('transferRef', { ref: p.transferRef }) : ''}
                </span>
                {p.rejectReason && <span className="text-xs text-danger">{t('reason', { reason: p.rejectReason })}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${PAYOUT_STATUS_CLASS[p.status]}`}>
                  {tFin(`instructorPayoutStatus.${p.status}`)}
                </span>
                {voucherByCode.has(p.code) && (
                  <button
                    type="button"
                    onClick={() => downloadVoucher(voucherByCode.get(p.code)!.id, voucherByCode.get(p.code)!.number)}
                    title={t('slipTitle')}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint"
                  >
                    {t('slip')}
                  </button>
                )}
                {(p.status === 'PENDING_EMAIL' || p.status === 'REQUESTED') && active.length > 1 && changingId !== p.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setChangingId(p.id);
                      setPickedAccountId(null);
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-tint"
                  >
                    {t('changeAccount')}
                  </button>
                )}
                {(p.status === 'PENDING_EMAIL' || p.status === 'REQUESTED') && (
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => handleCancel(p.id)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                )}
              </div>
              {changingId === p.id && (
                <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-surface p-3">
                  <select
                    value={pickedAccountId ?? ''}
                    onChange={(e) => setPickedAccountId(e.target.value === '' ? null : Number(e.target.value))}
                    aria-label={t('newAccountAria')}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised p-2 text-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="">{t('pickNewAccount')}</option>
                    {active.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} {a.accountMask}{a.primary ? t('defaultSuffix') : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pickedAccountId === null || change.isPending}
                    onClick={() =>
                      pickedAccountId !== null &&
                      change.mutate(
                        { payoutId: p.id, accountId: pickedAccountId },
                        {
                          onSuccess: () => {
                            toast.success(t('accountChanged'));
                            setChangingId(null);
                          },
                          onError: (err) => toast.error(err instanceof ApiError ? err.message : t('accountChangeFailed')),
                        },
                      )
                    }
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                  >
                    {t('apply')}
                  </button>
                  <button type="button" onClick={() => setChangingId(null)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink">
                    {t('cancel')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data && data.length > 0 && list.total > 0 && <Pager page={list.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}
    </section>
  );
}
