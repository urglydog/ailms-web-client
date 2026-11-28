'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useCancelPromotion, useMyPromotions, useRequestPromotion } from '@/hooks/usePromotions';
import { ApiError } from '@/lib/api/client';
import { dateTime, money } from '@/lib/finance';
import {
  PROMOTION_PLACEMENT_LABEL,
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
  const t = useTranslations('promotionPanel');
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
          toast.success(t('submitted'));
          setNote('');
          setCourseId('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('submitError')),
      },
    );
  };

  const handleCancel = (id: number) =>
    cancel.mutate(id, {
      onSuccess: () => toast.success(t('cancelled')),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : t('cancelError')),
    });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
      <div>
        <h2 className="m-0 font-display text-base font-bold text-ink">{t('title')}</h2>
        <p className="m-0 mt-1 text-xs text-ink-muted">
          {t('intro')}
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('course')}</span>
          <SearchableSelect
            options={shareable.map((c) => ({ value: c.courseId, label: c.title }))}
            value={courseId}
            onChange={setCourseId}
            placeholder={t('pickCourse')}
            searchPlaceholder={t('searchCourse')}
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('placement')}</span>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as PromotionPlacement)}
            className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            {(Object.keys(PROMOTION_PLACEMENT_LABEL) as PromotionPlacement[]).map((p) => (
              <option key={p} value={p}>{t(`placements.${p}`)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">{t('note')}</span>
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
          {request.isPending ? t('sending') : t('submit')}
        </button>
      </form>

      {isLoading ? (
        <p className="m-0 text-sm text-ink-muted">{t('loading')}</p>
      ) : !data || data.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{t('empty')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {data.map((p) => (
            <li key={p.id} className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{p.courseTitle}</span>
                <span className="flex items-center gap-2">
                  {p.active && <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-bold text-accent-dark">{t('running')}</span>}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[p.status]}`}>{t(`status.${p.status}`)}</span>
                </span>
              </div>
              <div className="text-xs text-ink-muted">
                {t(`placements.${p.placement}`)}
                {p.startAt && p.endAt ? ` · ${dateTime(p.startAt)} → ${dateTime(p.endAt)}` : ''}
              </div>
              {p.adminNote && <div className="text-xs text-ink">{t('adminNote', { note: p.adminNote })}</div>}
              {(p.status === 'APPROVED' || p.status === 'ENDED') && (
                <div className="text-xs text-ink-muted">
                  {t('effect', {
                    ordersDuring: p.ordersDuring,
                    revenueDuring: money(p.revenueDuring),
                    ordersBefore: p.ordersBefore,
                    revenueBefore: money(p.revenueBefore),
                  })}
                </div>
              )}
              {(p.status === 'REQUESTED' || p.status === 'APPROVED') && (
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => handleCancel(p.id)}
                  className="w-fit rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50"
                >
                  {p.status === 'APPROVED' ? t('withdraw') : t('cancel')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
