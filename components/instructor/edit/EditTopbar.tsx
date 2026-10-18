'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Eye, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import type { CourseStatus } from '@/types/domain';
import { CompletionMeter } from './CompletionMeter';

interface EditTopbarProps {
  title: string;
  status: CourseStatus;
  completion: number;
  missing: string[];
  canSubmit: boolean;
  submitting: boolean;
  settingsOpen: boolean;
  /** Khóa có ít nhất một bài học thì mới xem trước được với tư cách giảng viên. */
  canPreviewAsInstructor: boolean;
  onSubmit: () => void;
  onToggleSettings: () => void;
  onPreviewInstructor: () => void;
  onPreviewLearner: () => void;
}

/** Thanh trên cố định của trình chỉnh sửa khóa học: quay lại, tên và trạng thái, tiến độ hoàn thiện, Xem trước, Cài đặt
 * và nút Gửi duyệt luôn thấy (chỉ khi khóa ở trạng thái Nháp hoặc Bị từ chối). */
export function EditTopbar({
  title,
  status,
  completion,
  missing,
  canSubmit,
  submitting,
  settingsOpen,
  canPreviewAsInstructor,
  onSubmit,
  onToggleSettings,
  onPreviewInstructor,
  onPreviewLearner,
}: EditTopbarProps) {
  const t = useTranslations('instructor.edit');
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const showSubmit = status === 'DRAFT' || status === 'REJECTED';

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) setPreviewOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [previewOpen]);

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Link href="/instructor/courses" className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-accent-dark no-underline hover:underline">
          <ArrowLeft size={16} aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('back')}</span>
        </Link>
        <span aria-hidden className="h-4 w-px bg-line" />
        <h1 className="m-0 min-w-0 max-w-[260px] truncate font-display text-[15px] font-bold text-ink">{title}</h1>
        <CourseStatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showSubmit && <CompletionMeter percent={completion} missing={missing} />}

        <div ref={previewRef} className="relative">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            aria-expanded={previewOpen}
            aria-haspopup="menu"
            className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-tint"
          >
            <Eye size={15} aria-hidden />
            {t('preview.label')}
            <ChevronDown size={14} aria-hidden className={previewOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
          {previewOpen && (
            <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-card-hover">
              <button
                type="button"
                role="menuitem"
                disabled={!canPreviewAsInstructor}
                onClick={() => {
                  setPreviewOpen(false);
                  onPreviewInstructor();
                }}
                className="block w-full px-3.5 py-2 text-left text-[13px] text-ink hover:bg-surface disabled:cursor-not-allowed disabled:text-ink-muted disabled:opacity-60"
              >
                {t('preview.asInstructor')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPreviewOpen(false);
                  onPreviewLearner();
                }}
                className="block w-full px-3.5 py-2 text-left text-[13px] text-ink hover:bg-surface"
              >
                {t('preview.asLearner')}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleSettings}
          aria-pressed={settingsOpen}
          aria-label={t('settingsLabel')}
          title={t('settingsLabel')}
          className={`flex items-center justify-center rounded-lg border p-2 ${
            settingsOpen ? 'border-accent bg-tint text-accent-dark' : 'border-line text-ink hover:bg-tint'
          }`}
        >
          <Settings size={16} aria-hidden />
        </button>

        {showSubmit && (
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
            title={canSubmit ? undefined : t('submit.needMore')}
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === 'REJECTED' ? t('submit.resubmit') : t('submit.send')}
          </button>
        )}
      </div>
    </header>
  );
}
