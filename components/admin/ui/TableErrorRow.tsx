'use client';

import { useTranslations } from 'next-intl';

/** Table row shown when a list query fails, so a failure is never mistaken for an empty list. */
export function TableErrorRow({ colSpan, onRetry }: { colSpan: number; onRetry?: () => void }) {
  const t = useTranslations('admin.common');
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-6 text-center">
        <div role="alert" className="flex flex-col items-center gap-2 text-danger">
          <span>{t('loadError')}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {t('retry')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
