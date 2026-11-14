'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCancelPromotion, useMyPromotions, useRequestPromotion } from '@/hooks/usePromotions';
import { ApiError } from '@/lib/api/client';
import { dateTime, money } from '@/lib/finance';
import {
  PROMOTION_PLACEMENT_LABEL,
  PROMOTION_STATUS_LABEL,
  type PromotionPlacement,
  type PromotionStatus,
} from '@/types/promotion';
import type { CourseShare } from '@/types/finance';

const STATUS_CLASS: Record<PromotionStatus, string> = {
  REQUESTED: 'bg-surface-raised text-ink border-warning',
  APPROVED: 'bg-success-tint text-success-ink border-success/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
  CANCELLED: 'bg-line-soft text-ink-muted border-line',
  ENDED: 'bg-line-soft text-ink-muted border-line',
};

/**
 * Đăng ký quảng bá của giảng viên (11/11/2026, Giai đoạn E): chương trình TỰ NGUYỆN — nền tảng đưa khóa đã được duyệt lên kệ "Được
 * đề xuất". Điều kiện: khóa đã xuất bản, công khai, có ảnh bìa và đủ bài học (BE kiểm). Hiệu quả hiển thị là ước tính (so với khoảng
 * bằng nhau ngay trước đó), không phải quy kết chính xác.
 */
export function PromotionPanel({ courses }: { courses: CourseShare[] }) {
  const { data, isLoading } = useMyPromotions();
  const request = useRequestPromotion();
  const cancel = useCancelPromotion();
  const shareable = courses.filter((c) => c.shareable);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [placement, setPlacement] = useState<PromotionPlacement>('HOME_FEATURED');
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseId === '') return;
    request.mutate(
      { courseId, placement, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi đăng ký. Quản trị viên sẽ xem xét và báo lại.');
          setNote('');
          setCourseId('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không gửi được đăng ký.'),
      },
    );
  };

  const handleCancel = (id: number) =>
    cancel.mutate(id, {
      onSuccess: () => toast.success('Đã hủy đăng ký.'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không hủy được đăng ký.'),
    });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div>
        <h2 className="m-0 font-display text-base font-bold text-ink">Quảng bá của nền tảng</h2>
        <p className="m-0 mt-1 text-xs text-ink-muted">
          Đăng ký để nền tảng đề xuất khóa của bạn ở kệ &quot;Được đề xuất&quot; trên trang chủ trong một khoảng thời gian. Miễn phí, tự nguyện,
          do quản trị viên duyệt.
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Khóa học</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Chọn khóa đã xuất bản</option>
            {shareable.map((c) => (
              <option key={c.courseId} value={c.courseId}>{c.title}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Vị trí</span>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as PromotionPlacement)}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            {(Object.keys(PROMOTION_PLACEMENT_LABEL) as PromotionPlacement[]).map((p) => (
              <option key={p} value={p}>{PROMOTION_PLACEMENT_LABEL[p]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Ghi chú (không bắt buộc)</span>
          <input
            type="text"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={courseId === '' || request.isPending}
          className="w-fit rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50 sm:col-span-3"
        >
          {request.isPending ? 'Đang gửi...' : 'Gửi đăng ký quảng bá'}
        </button>
      </form>

      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">Đang tải...</p>
      ) : !data || data.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">Bạn chưa có đăng ký quảng bá nào.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {data.map((p) => (
            <li key={p.id} className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{p.courseTitle}</span>
                <span className="flex items-center gap-2">
                  {p.active && <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-accent-dark">Đang chạy</span>}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[p.status]}`}>{PROMOTION_STATUS_LABEL[p.status]}</span>
                </span>
              </div>
              <div className="text-xs text-ink-muted">
                {PROMOTION_PLACEMENT_LABEL[p.placement]}
                {p.startAt && p.endAt ? ` · ${dateTime(p.startAt)} → ${dateTime(p.endAt)}` : ''}
              </div>
              {p.adminNote && <div className="text-xs text-ink">Quản trị viên: {p.adminNote}</div>}
              {(p.status === 'APPROVED' || p.status === 'ENDED') && (
                <div className="text-xs text-ink-muted">
                  Ước tính hiệu quả: {p.ordersDuring} đơn ({money(p.revenueDuring)}) trong thời gian chạy so với {p.ordersBefore} đơn (
                  {money(p.revenueBefore)}) ở khoảng bằng nhau ngay trước đó.
                </div>
              )}
              {(p.status === 'REQUESTED' || p.status === 'APPROVED') && (
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => handleCancel(p.id)}
                  className="w-fit rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50"
                >
                  {p.status === 'APPROVED' ? 'Gỡ quảng bá' : 'Hủy đăng ký'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
