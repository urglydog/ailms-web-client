'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { financeReportsApi } from '@/lib/api/financeReports';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { saveBlob } from '@/lib/invoices';
import type { ExportFormat, Granularity } from '@/types/financeReport';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));
const monthStart = (offset: number) => iso(new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1));
const monthEnd = (offset: number) => iso(new Date(new Date().getFullYear(), new Date().getMonth() + offset + 1, 0));

const GRAN_LABEL: Record<Granularity, string> = { DAY: 'Theo ngày', WEEK: 'Theo tuần', MONTH: 'Theo tháng' };
const REPORT_TYPE_LABEL: Record<string, string> = { DAILY: 'Hằng ngày', WEEKLY: 'Hằng tuần', MONTHLY: 'Hằng tháng', MANUAL: 'Theo yêu cầu' };
const FORMATS: { id: ExportFormat; label: string; title: string }[] = [
  { id: 'csv', label: 'CSV', title: 'Tải toàn bộ số liệu dạng CSV' },
  { id: 'xlsx', label: 'XLSX', title: 'Tải bảng tính Excel nhiều trang' },
  { id: 'pdf', label: 'PDF', title: 'Tải bản PDF tóm tắt (tối đa 60 dòng mỗi bảng)' },
];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className="font-display text-xl font-bold text-ink">{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}

/**
 * Thống kê tài chính (20/11/2026, Hóa đơn H3–H4): số liệu toàn nền tảng theo kỳ, xuất CSV/XLSX/PDF, lịch sử báo cáo tự động và "Chạy ngay".
 * Số liệu do BE tính (loại trừ tài khoản demo); trang chỉ hiển thị. Quyền ADMIN do BE kiểm.
 */
export default function AdminFinanceReportsPage() {
  const qc = useQueryClient();
  const [from, setFrom] = useState(() => monthStart(0));
  const [to, setTo] = useState(() => iso(new Date()));
  const [gran, setGran] = useState<Granularity>('DAY');
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const enabled = !!getAccessToken();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'finance-report', from, to, gran],
    queryFn: () => financeReportsApi.get(from, to, gran),
    enabled: enabled && !!from && !!to && from <= to,
  });
  const { data: snapshots } = useQuery({
    queryKey: ['admin', 'finance-report-snapshots'],
    queryFn: () => financeReportsApi.snapshots(),
    enabled,
  });

  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Thao tác không thành công. Vui lòng thử lại.');

  const runNow = useMutation({
    mutationFn: () => financeReportsApi.runNow(from, to),
    onSuccess: (res) => {
      toast.success(res.emailsSent > 0 ? 'Đã tạo báo cáo và gửi đến email của bạn.' : 'Đã tạo báo cáo nhưng chưa gửi được email. Bạn vẫn có thể tải file ở trên.');
      qc.invalidateQueries({ queryKey: ['admin', 'finance-report-snapshots'] });
    },
    onError,
  });

  const download = async (format: ExportFormat) => {
    setBusy(format);
    try {
      saveBlob(await financeReportsApi.export(from, to, gran, format), `bao-cao-tai-chinh-${from}_${to}.${format}`);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(null);
    }
  };

  const preset = (a: string, b: string) => {
    setFrom(a);
    setTo(b);
  };
  const s = data?.summary;
  const rec = data?.reconciliation;
  const inputCls = 'rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent';
  const btnCls = 'rounded-lg border border-line px-3 py-2 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50';

  return (
    <>
      <PageHeader
        title="Thống kê tài chính"
        subtitle="Doanh thu, hoàn tiền, chi trả giảng viên và đối soát PayOS của toàn nền tảng. Số liệu loại trừ tài khoản demo."
        action={
          <Link href="/admin/settings" className="text-sm font-semibold text-accent-dark hover:underline">
            Cấu hình báo cáo tự động
          </Link>
        }
      />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Gom nhóm</span>
          <select value={gran} onChange={(e) => setGran(e.target.value as Granularity)} className={inputCls}>
            {(Object.keys(GRAN_LABEL) as Granularity[]).map((g) => (
              <option key={g} value={g}>{GRAN_LABEL[g]}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => preset(daysAgo(6), iso(new Date()))} className={btnCls}>7 ngày</button>
          <button type="button" onClick={() => preset(daysAgo(29), iso(new Date()))} className={btnCls}>30 ngày</button>
          <button type="button" onClick={() => preset(monthStart(0), iso(new Date()))} className={btnCls}>Tháng này</button>
          <button type="button" onClick={() => preset(monthStart(-1), monthEnd(-1))} className={btnCls}>Tháng trước</button>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} type="button" title={f.title} disabled={busy !== null || !data} onClick={() => download(f.id)} className={btnCls}>
              {busy === f.id ? 'Đang xuất...' : f.label}
            </button>
          ))}
          <button
            type="button"
            disabled={runNow.isPending || !from || !to || from > to}
            onClick={() => runNow.mutate()}
            title="Tạo báo cáo cho kỳ đang chọn, lưu vào lịch sử và gửi file đến email của bạn"
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {runNow.isPending ? 'Đang chạy...' : 'Chạy ngay'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError || !s || !rec || !data ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          {error instanceof ApiError ? error.message : 'Không tải được số liệu. Vui lòng kiểm tra khoảng ngày và thử lại.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Doanh thu gộp" value={money(s.grossRevenue)} hint={`${s.orders} đơn thanh toán`} />
            <Stat label="Tiền hoàn" value={money(s.refunds)} hint={`${s.refundCount} khoản · tỷ lệ ${s.refundRatePct}%`} />
            <Stat label="Doanh thu ròng" value={money(s.netRevenue)} hint="Doanh thu gộp trừ tiền hoàn" />
            <Stat label="Phần nền tảng" value={money(s.platformFee)} hint="Các đơn còn hiệu lực" />
            <Stat label="Phần giảng viên" value={money(s.instructorEarning)} hint="Các đơn còn hiệu lực" />
            <Stat label="Đã chi trả giảng viên" value={money(s.payoutsPaid)} hint={`${s.payoutsPaidCount} lần rút`} />
            <Stat label="Chi phí chuyển tiền PayOS" value={money(s.payosFee)} hint={`${s.payosOrders} lệnh chi thành công, do nền tảng chịu`} />
            <Stat label="Nghĩa vụ chưa trả giảng viên" value={money(s.obligations)} hint={`Tại thời điểm xem · chờ chi ${money(s.pendingPayouts)} · phải thu ${money(s.receivables)}`} />
          </div>

          <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
            <h2 className="m-0 font-display text-base font-bold text-ink">Đối soát chi qua PayOS</h2>
            <p className="m-0 text-sm text-ink-muted">
              Tổng lệnh chi PayOS thành công <strong className="text-ink">{money(rec.payosOutflow)}</strong> ({rec.payosOrders} lệnh) so với khoản hoàn tiền{' '}
              {money(rec.recordedRefunds)} và chi trả giảng viên {money(rec.recordedPayouts)} đã ghi nhận bằng PayOS ({rec.recordedCount} khoản).
            </p>
            <p className={`m-0 text-sm font-semibold ${rec.difference === 0 ? 'text-success' : 'text-danger'}`}>
              {rec.difference === 0 ? 'Khớp: không có chênh lệch.' : `Chênh lệch ${money(rec.difference)}. Cần kiểm tra các lệnh chi trong kỳ.`}
            </p>
          </section>

          <section className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
            <h2 className="m-0 px-5 pt-4 font-display text-base font-bold text-ink">Theo kỳ</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Kỳ</th>
                  <th className="px-4 py-3 text-right">Đơn</th>
                  <th className="px-4 py-3 text-right">Doanh thu gộp</th>
                  <th className="px-4 py-3 text-right">Tiền hoàn</th>
                  <th className="px-4 py-3 text-right">Nền tảng</th>
                  <th className="px-4 py-3 text-right">Giảng viên</th>
                  <th className="px-4 py-3 text-right">Đã chi trả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.buckets.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-muted">Không có giao dịch trong kỳ này.</td></tr>
                ) : (
                  data.buckets.map((b) => (
                    <tr key={b.period}>
                      <td className="px-4 py-3 font-mono text-xs text-ink">{b.period}</td>
                      <td className="px-4 py-3 text-right text-ink">{b.orders}</td>
                      <td className="px-4 py-3 text-right text-ink">{money(b.grossRevenue)}</td>
                      <td className="px-4 py-3 text-right text-ink">{money(b.refunds)}</td>
                      <td className="px-4 py-3 text-right text-ink">{money(b.platformFee)}</td>
                      <td className="px-4 py-3 text-right text-ink">{money(b.instructorEarning)}</td>
                      <td className="px-4 py-3 text-right text-ink">{money(b.payoutsPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
              <h2 className="m-0 px-5 pt-4 font-display text-base font-bold text-ink">Khóa học nhiều doanh thu nhất</h2>
              <table className="mt-2 w-full text-left text-sm">
                <tbody className="divide-y divide-line-soft">
                  {data.courses.length === 0 ? (
                    <tr><td className="px-4 py-6 text-center text-ink-muted">Chưa có dữ liệu.</td></tr>
                  ) : (
                    data.courses.slice(0, 10).map((c) => (
                      <tr key={c.courseId}>
                        <td className="px-4 py-3 text-ink">
                          {c.title}
                          <div className="text-xs text-ink-muted">{c.instructorName} · {c.orders} đơn{c.refundedOrders > 0 ? ` · ${c.refundedOrders} đã hoàn` : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">{money(c.grossRevenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
            <section className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
              <h2 className="m-0 px-5 pt-4 font-display text-base font-bold text-ink">Giảng viên nhiều doanh thu nhất</h2>
              <table className="mt-2 w-full text-left text-sm">
                <tbody className="divide-y divide-line-soft">
                  {data.instructors.length === 0 ? (
                    <tr><td className="px-4 py-6 text-center text-ink-muted">Chưa có dữ liệu.</td></tr>
                  ) : (
                    data.instructors.slice(0, 10).map((i) => (
                      <tr key={i.instructorId}>
                        <td className="px-4 py-3 text-ink">
                          {i.name}
                          <div className="text-xs text-ink-muted">{i.email} · {i.orders} đơn · đã chi trả {money(i.payoutsPaid)}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">{money(i.grossRevenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
        <h2 className="m-0 font-display text-base font-bold text-ink">Lịch sử báo cáo</h2>
        {!snapshots || snapshots.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">Chưa có báo cáo nào. Báo cáo định kỳ được tạo tự động theo cấu hình; bạn cũng có thể bấm &quot;Chạy ngay&quot;.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {snapshots.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink">
                  {REPORT_TYPE_LABEL[r.reportType] ?? r.reportType} · {r.periodFrom === r.periodTo ? r.periodFrom : `${r.periodFrom} đến ${r.periodTo}`}
                </span>
                <span className="text-xs text-ink-muted">
                  {dateTime(r.createdAt)} · {r.emailedTo ? `đã gửi ${r.emailedTo}` : 'chưa gửi email'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
