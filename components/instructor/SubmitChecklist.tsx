import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { missingConditionHref } from '@/lib/instructor/missingConditionLink';

interface SubmitChecklistProps {
  missingConditions: string[];
  canSubmit: boolean;
}

/** Checklist điều kiện gửi duyệt — phản chiếu đúng BR-COURSE-01 (tiêu đề, mô tả, ảnh bìa, ≥1 chương, ≥3 bài sẵn sàng). */
export function SubmitChecklist({ missingConditions, canSubmit }: SubmitChecklistProps) {
  const t = useTranslations('instructor.submitChecklist');
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <span className="font-display text-[13.5px] font-bold text-ink">{t('title')}</span>
      {canSubmit ? (
        <div className="flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-[12.5px] font-semibold text-success-ink">
          <span>✓</span>
          <span>{t('ready')}</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {missingConditions.map((condition) => {
            const href = missingConditionHref(condition);
            return (
              <li key={condition} className="flex items-center gap-2 text-[12.5px] text-danger">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger/10 text-[10px]">✗</span>
                <span>{condition}</span>
                {href && (
                  <Link href={href} className="font-semibold text-accent hover:underline">
                    {t('fixNow')}
                  </Link>
                )}
              </li>
            );
          })}
          <li className="flex items-center gap-2 text-[12.5px] text-success-ink">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-tint text-[10px]">✓</span>
            <span>{t('recommend')}</span>
          </li>
        </ul>
      )}
    </div>
  );
}
