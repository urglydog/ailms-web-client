'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Pager } from '@/components/ui/SearchPanel';
import { useListControls } from '@/hooks/useListControls';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError } from '@/lib/api/client';
import { adminPromotionsApi } from '@/lib/api/promotions';
import { getAccessToken } from '@/lib/auth/token';
import { dateTime, money } from '@/lib/finance';
import {
  PROMOTION_PLACEMENT_LABEL,
  PROMOTION_STATUS_LABEL,
  type PromotionRes,
  type PromotionStatus,
} from '@/types/promotion';

const STATUSES: PromotionStatus[] = ['REQUESTED', 'APPROVED', 'ENDED', 'REJECTED', 'CANCELLED'];
type Dialog = { kind: 'approve' | 'reject' | 'end'; promotion: PromotionRes };

/** `datetime-local` không có múi giờ: dựng giờ địa phương rồi gửi dạng ISO không hậu tố (BE đọc `LocalDateTime`). */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Duyệt quảng bá khóa học (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn E): xem đăng ký của giảng viên, duyệt kèm khung thời gian
 * (tối đa 90 ngày), từ chối kèm lý do, hoặc gỡ sớm một đợt đang chạy (vd. phát hiện vi phạm, bắt buộc nêu lý do). Thứ tự hiển thị là xoay vòng công bằng theo giờ, không có độ ưu tiên chấm tay. Cột hiệu quả là ƯỚC TÍNH (so với khoảng
 * bằng nhau ngay trước đó), không phải quy kết chính xác.
 */
export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'ALL'>('REQUESTED');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [endAt, setEndAt] = useState('');
  const [note, setNote] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'promotions', statusFilter],
    queryFn: () => adminPromotionsApi.list(statusFilter === 'ALL' ? undefined : statusFilter),
    enabled: !!getAccessToken(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
  const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Thao tác không thành công.');
  const closeDialog = () => {
    setDialog(null);
    setNote('');
    setEndAt('');
  };

  const approve = useMutation({
    mutationFn: (v: { id: number; endAt: string; note: string }) =>
      adminPromotionsApi.approve(v.id, { endAt: v.endAt, note: v.note || undefined }),
    onSuccess: () => { toast.success('Đã duyệt, khóa học sẽ lên kệ ngay.'); closeDialog(); refresh(); },
    onError,
  });
  const reject = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPromotionsApi.reject(v.id, v.reason),
    onSuccess: () => { toast.success('Đã từ chối đăng ký.'); closeDialog(); refresh(); },
    onError,
  });
  const end = useMutation({
    mutationFn: (v: { id: number; reason: string }) => adminPromotionsApi.end(v.id, v.reason),
    onSuccess: () => { toast.success('Đã gỡ quảng bá, giảng viên sẽ nhận được thông báo.'); closeDialog(); refresh(); },
    onError,
  });

  const openApprove = (p: PromotionRes) => {
    setDialog({ kind: 'approve', promotion: p });
    setEndAt(toLocalInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
  };

  const submit = () => {
    if (!dialog) return;
    const id = dialog.promotion.id;
    if (dialog.kind === 'approve') {
      approve.mutate({ id, endAt: `${endAt}:00`, note: note.trim() });
    } else if (dialog.kind === 'end') {
      end.mutate({ id, reason: note.trim() });
    } else {
      reject.mutate({ id, reason: note.trim() });
    }
  };

  // Hàng chờ duyệt hiện sẵn (mặc định); tìm theo khóa/giảng viên và phân trang 10 dòng ở trình duyệt (danh sách theo trạng thái nên không lớn).
  const list = useListControls(data, {
    pageSize: 10,
    match: (p, q) => p.courseTitle.toLowerCase().includes(q) || p.instructorName.toLowerCase().includes(q) || p.instructorEmail.toLowerCase().includes(q),
  });
  const rows = list.pageItems;
  const busy = approve.isPending || reject.isPending || end.isPending;

  return (
    <>
      <PageHeader
        title="Quảng bá khóa học"
        subtitle="Duyệt đăng ký quảng bá của giảng viên. Khóa được duyệt xuất hiện ở kệ &quot;Được đề xuất&quot; trong khung thời gian bạn chọn."
      />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface-raised p-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-64">
          <span className="text-xs font-semibold text-ink-muted">Tìm đăng ký quảng bá</span>
          <input
            type="search"
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Tên khóa học, tên hoặc email giảng viên..."
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-64">
          <span className="text-xs font-semibold text-ink-muted">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PromotionStatus | 'ALL')}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{PROMOTION_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">Không tải được danh sách.</div>
      ) : list.total === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Không có đăng ký nào.</div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{p.courseTitle}</div>
                  <div className="text-xs text-ink-muted">
                    {p.instructorName} · {p.instructorEmail} · {PROMOTION_PLACEMENT_LABEL[p.placement]}
                  </div>
                </div>
                <span className="flex items-center gap-2">
                  {p.active && <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-accent-dark">Đang chạy</span>}
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink">{PROMOTION_STATUS_LABEL[p.status]}</span>
                </span>
              </div>
              {p.requestNote && <div className="text-sm text-ink">Ghi chú của giảng viên: {p.requestNote}</div>}
              {p.startAt && p.endAt && (
                <div className="text-xs text-ink-muted">
                  {dateTime(p.startAt)} → {dateTime(p.endAt)} 
                </div>
              )}
              {(p.status === 'APPROVED' || p.status === 'ENDED') && (
                <div className="text-xs text-ink-muted">
                  Ước tính: {p.ordersDuring} đơn ({money(p.revenueDuring)}) khi chạy so với {p.ordersBefore} đơn ({money(p.revenueBefore)}) khoảng bằng nhau trước đó.
                </div>
              )}
              {p.adminNote && <div className="text-xs text-ink">Ghi chú quản trị: {p.adminNote}</div>}
              <div className="flex flex-wrap gap-2">
                {p.status === 'REQUESTED' && (
                  <>
                    <button type="button" disabled={busy} onClick={() => openApprove(p)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                      Duyệt
                    </button>
                    <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'reject', promotion: p })} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger/5 disabled:opacity-50">
                      Từ chối
                    </button>
                  </>
                )}
                {p.status === 'APPROVED' && (
                  <button type="button" disabled={busy} onClick={() => setDialog({ kind: 'end', promotion: p })} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50">
                    Gỡ quảng bá
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !isError && list.total > 0 && <Pager page={list.page} totalPages={list.totalPages} total={list.total} onPage={list.setPage} />}

      {dialog && (
        <Modal
          open
          onClose={closeDialog}
          size="sm"
          closeOnBackdrop={false}
          title={dialog.kind === 'approve' ? 'Duyệt quảng bá' : dialog.kind === 'end' ? 'Gỡ quảng bá' : 'Từ chối đăng ký'}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeDialog} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Hủy</button>
              <button
                type="button"
                disabled={busy || (dialog.kind === 'approve' ? !endAt : !note.trim())}
                onClick={submit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <p className="m-0 text-ink-muted">{dialog.promotion.courseTitle}</p>
            {dialog.kind === 'approve' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold text-ink">Kết thúc lúc *</span>
                  <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
                  <span className="text-xs text-ink-muted">Bắt đầu ngay khi duyệt; tối đa 90 ngày.</span>
                </label>
              </>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold text-ink">{dialog.kind === 'approve' ? 'Ghi chú (không bắt buộc)' : 'Lý do * (giảng viên sẽ nhận được nội dung này)'}</span>
              <textarea value={note} maxLength={500} rows={3} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-ink outline-none focus:border-accent" />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
