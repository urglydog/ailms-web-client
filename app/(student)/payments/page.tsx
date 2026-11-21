'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pager } from '@/components/ui/SearchPanel';
import { ListSearch } from '@/components/ui/ListSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { getAccessToken } from '@/lib/auth/token';
import { disputesApi } from '@/lib/api/disputes';
import { paymentsApi } from '@/lib/api/payments';
import type { PaymentRes } from '@/types/domain';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMyInvoices } from '@/hooks/useInvoices';
import { ApiError } from '@/lib/api/client';
import { invoicesApi } from '@/lib/api/invoices';
import { saveBlob } from '@/lib/invoices';
import type { Invoice } from '@/types/invoice';
import PaymentDetailModal from './PaymentDetailModal';

const GROUPS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'SUCCESS', label: 'Thành công' },
  { id: 'PENDING', label: 'Đang chờ' },
  { id: 'FAILED', label: 'Thất bại' },
  { id: 'REFUNDED', label: 'Hoàn tiền' },
] as const;

export default function PaymentsHistoryPage() {
  const [group, setGroup] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRes | null>(null);

  // Lọc/tìm/phân trang PHÍA MÁY CHỦ: chỉ tải đúng một trang (10 giao dịch) thay vì toàn bộ lịch sử.
  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ['payments', 'mine', group, debouncedSearch, from, to, page],
    queryFn: () => paymentsApi.searchMine({ status: group, q: debouncedSearch, from, to, page }),
    enabled: !!getAccessToken(),
    placeholderData: (prev) => prev,
  });
  const payments = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  useEffect(() => {
    if (isError) toast.error('Lỗi khi tải lịch sử giao dịch');
  }, [isError]);

  // Giao dịch đã DUYỆT hoàn tiền nhưng tiền CHƯA chuyển: hiện "chờ chuyển" thay vì "Đã hoàn tiền" cho khớp trang Khiếu nại.
  const [awaitingTransfer, setAwaitingTransfer] = useState<Set<string>>(new Set());
  // Chứng từ của chính mình, ghép vào từng giao dịch theo mã đơn: biên lai (đơn đã thanh toán) và phiếu hoàn tiền (đơn đã hoàn xong).
  const { data: invoices } = useMyInvoices();
  const byOrder = useMemo(() => {
    const map = new Map<string, { receipt?: Invoice; refund?: Invoice }>();
    for (const inv of invoices ?? []) {
      if (inv.type !== 'RECEIPT' && inv.type !== 'REFUND') continue;
      for (const ref of inv.refs) {
        const entry = map.get(ref) ?? {};
        if (inv.type === 'RECEIPT') entry.receipt = inv;
        else entry.refund = inv;
        map.set(ref, entry);
      }
    }
    return map;
  }, [invoices]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const downloadInvoice = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      saveBlob(await invoicesApi.pdf(inv.id), `${inv.number}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không tải được chứng từ. Vui lòng thử lại sau ít phút.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    disputesApi
      .listMine()
      .then((ds) => setAwaitingTransfer(new Set(ds.filter((d) => d.refundTransferStatus === 'PENDING_TRANSFER' || d.refundTransferStatus === 'AWAITING_ACCOUNT').map((d) => d.paymentTxnRef))))
      .catch(() => undefined);
  }, []);

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

  const getStatusLabel = (status: string, txnRef?: string) => {
    if (status === 'REFUNDED' && txnRef && awaitingTransfer.has(txnRef)) return 'Đã duyệt hoàn · chờ chuyển';
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
    <div className="shell py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Lịch sử giao dịch</h1>
      <p className="mb-5 text-sm text-ink-muted">Mỗi giao dịch có biên lai điện tử và, nếu được hoàn tiền, phiếu hoàn tiền để bạn tải về ngay tại đây.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => {
              setGroup(g.id);
              setPage(0);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              group === g.id ? 'bg-accent text-white' : 'border border-line bg-surface-raised text-ink-muted hover:border-accent hover:text-ink'
            }`}
          >
            {g.label} <span className={group === g.id ? 'text-white/85' : 'text-ink-muted'}>({(data?.counts[g.id] ?? 0).toLocaleString('vi-VN')})</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-raised p-3">
        <ListSearch
          label="Tìm giao dịch"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Mã đơn, mã cổng thanh toán hoặc tên khóa học..."
          className="sm:w-80"
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        {(from || to || search || group !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setFrom('');
              setTo('');
              setSearch('');
              setGroup('ALL');
              setPage(0);
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-ink-muted">Đang tải dữ liệu...</div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          {group === 'ALL' && !search && !from && !to ? 'Bạn chưa có giao dịch nào.' : 'Không có giao dịch nào khớp bộ lọc.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink-muted">
            <thead className="bg-surface-raised text-xs uppercase text-ink">
              <tr>
                <th className="px-6 py-4">Mã tham chiếu (Hệ thống)</th>
                <th className="px-6 py-4">Mã GD Cổng thanh toán</th>
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Phương thức</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian thanh toán</th>
                <th className="px-6 py-4">Chứng từ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr 
                  key={p.txnRef} 
                  className="hover:bg-surface-raised transition-colors cursor-pointer"
                  onClick={() => setSelectedPayment(p)}
                >
                  <td className="px-6 py-4 font-mono font-medium text-ink">{p.txnRef}</td>
                  <td className="px-6 py-4 font-mono text-ink-muted text-sm">{p.gatewayTxnNo || 'Chưa có'}</td>
                  <td className="px-6 py-4 font-medium text-ink max-w-[200px] truncate" title={p.courseTitle}>
                    {p.courseTitle}
                  </td>
                  <td className="px-6 py-4 text-accent font-semibold">
                    {p.amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">{p.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status, p.txnRef)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1.5">
                      {[byOrder.get(p.txnRef)?.receipt, byOrder.get(p.txnRef)?.refund].map((inv) =>
                        inv ? (
                          <button
                            key={inv.id}
                            type="button"
                            disabled={downloadingId === inv.id}
                            onClick={() => downloadInvoice(inv)}
                            title={`Tải ${inv.type === 'REFUND' ? 'phiếu hoàn tiền' : 'biên lai'} ${inv.number} (PDF)`}
                            className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? 'Đang tải...' : inv.type === 'REFUND' ? 'Phiếu hoàn' : 'Biên lai'}
                          </button>
                        ) : null,
                      )}
                      {!byOrder.get(p.txnRef) && (p.status === 'PAID' || p.status === 'REFUNDED') && (
                        <span className="text-xs text-ink-muted" title="Biên lai được tạo sau khi thanh toán hoàn tất, thường trong vài phút">Đang tạo</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <Pager page={page} totalPages={totalPages} total={data?.total ?? 0} onPage={setPage} />
          </div>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetailModal 
          payment={selectedPayment}
          awaitingTransfer={awaitingTransfer.has(selectedPayment.txnRef)}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
