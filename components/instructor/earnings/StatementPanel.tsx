'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMyInvoices } from '@/hooks/useInvoices';
import { ApiError } from '@/lib/api/client';
import { invoicesApi } from '@/lib/api/invoices';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import { saveBlob } from '@/lib/invoices';
import type { Invoice } from '@/types/invoice';

// Hiệu năng đợt 7 (B6): biểu đồ recharts trong chi tiết hóa đơn chỉ tải khi mở chi tiết.
const InvoiceDetailBody = dynamic(() => import('@/components/invoices/InvoiceDetailBody').then((m) => m.InvoiceDetailBody), { ssr: false });

const monthLabel = (period: string) => `Tháng ${period.slice(4, 6)}/${period.slice(0, 4)}`;

/**
 * Bảng kê thu nhập tháng (20/11/2026): giảng viên chọn tháng để xem thu nhập từng khóa (biểu đồ cột), hoàn tiền, khoản đã rút và chia sẻ file PDF.
 * Thay cho danh sách "Chứng từ" rời rạc: phiếu chi nằm ngay ở Lịch sử rút tiền, biên lai trả nợ nằm cuối khung này.
 */
export function StatementPanel() {
  const { data: invoices, isLoading } = useMyInvoices();
  const statements = useMemo(
    () => (invoices ?? []).filter((i) => i.type === 'STATEMENT').sort((a, b) => (b.refs[0] ?? '').localeCompare(a.refs[0] ?? '')),
    [invoices],
  );
  const debtReceipts = useMemo(() => (invoices ?? []).filter((i) => i.type === 'DEBT_RECEIPT'), [invoices]);
  const [picked, setPicked] = useState<number | null>(null);
  const current: Invoice | undefined = statements.find((s) => s.id === picked) ?? statements[0];

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['invoices', 'detail', current?.id],
    queryFn: () => invoicesApi.detail(current!.id),
    enabled: !!current && !!getAccessToken(),
  });

  const download = async (inv: Invoice) => {
    saveBlob(await invoicesApi.pdf(inv.id), `${inv.number}.pdf`);
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-base font-bold text-ink">Bảng kê thu nhập tháng</h2>
        {current && (
          <div className="flex items-center gap-2">
            <select
              value={current.id}
              onChange={(e) => setPicked(Number(e.target.value))}
              aria-label="Chọn tháng"
              className="rounded-lg border border-line bg-surface-raised p-2 text-sm text-ink outline-none focus:border-accent"
            >
              {statements.map((s) => (
                <option key={s.id} value={s.id}>{monthLabel(s.refs[0] ?? '000000')}</option>
              ))}
            </select>
            <ExportMenu
              items={[{ id: 'pdf', label: 'Tải PDF', hint: 'Bảng kê của tháng đang xem', icon: <FileDown size={15} aria-hidden />, onSelect: () => download(current) }]}
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : !current ? (
        <p className="m-0 text-sm text-ink-muted">
          Bảng kê của từng tháng sẽ xuất hiện tại đây ngay sau khi tháng kết thúc, nếu bạn có thu nhập, hoàn tiền hoặc khoản rút trong tháng đó.
        </p>
      ) : detailLoading || !detail ? (
        <Skeleton className="h-40" />
      ) : (
        <InvoiceDetailBody detail={detail} />
      )}
      {debtReceipts.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
          <h3 className="m-0 text-sm font-bold text-ink">Biên lai trả nợ</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {debtReceipts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-ink-muted">
                  <span className="font-mono text-xs">{d.number}</span> · {dateTime(d.issuedAt)} · {money(d.total)}
                </span>
                <button
                  type="button"
                  onClick={() => download(d).catch((err) => toast.error(err instanceof ApiError ? err.message : 'Không tải được biên lai.'))}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-accent-dark hover:bg-tint"
                >
                  PDF
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
