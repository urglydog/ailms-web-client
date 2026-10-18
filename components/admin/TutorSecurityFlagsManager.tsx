'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTutorSecurityFlags } from '@/hooks/useTutorSecurity';

const PAGE_SIZE = 20;

/** BR-TUTOR-SEC-06 (doc/feat/injection/DacTa_ChongPromptInjection_TutorAgent.md) — CHỈ để Admin
 * xem lại các tin nhắn học viên gửi vào Socratic Tutor Agent bị pre-check heuristic gắn cờ. Đây
 * là log THEO DÕI, không có hành động khóa/chặn tài khoản nào gắn với trang này ở v1 — pattern
 * nghi vấn được cấu hình trong DB (`tutor_security_patterns`), không sửa được từ trang này. */
export function TutorSecurityFlagsManager() {
  const t = useTranslations('admin.tutorSec');
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useTutorSecurityFlags({ page, size: PAGE_SIZE });
  const flags = data?.content ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.student')}</th>
              <th className="px-6 py-4">{t('cols.course')}</th>
              <th className="px-6 py-4">{t('cols.pattern')}</th>
              <th className="px-6 py-4">{t('cols.message')}</th>
              <th className="px-6 py-4">{t('cols.time')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-ink-muted">{t('loading')}</td>
              </tr>
            )}
            {!isLoading && flags.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-ink-muted">
                  {t('empty')}
                </td>
              </tr>
            )}
            {flags.map((f) => (
              <tr key={f.id} className="hover:bg-surface align-top">
                <td className="px-6 py-3">
                  <div className="font-semibold text-ink">{f.studentName}</div>
                  <div className="text-xs text-ink-muted">{f.studentEmail}</div>
                </td>
                <td className="px-6 py-3 text-ink-muted">{f.courseTitle}</td>
                <td className="px-6 py-3">
                  <span className="inline-block rounded-full border border-warning bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {f.matchedPattern}
                  </span>
                </td>
                <td className="px-6 py-3 max-w-md text-ink-muted" title={f.messageSnapshot}>
                  <span className="line-clamp-2">{f.messageSnapshot}</span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-ink-muted">
                  {new Date(f.createdAt).toLocaleString(locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label={t('pager.aria')} className="flex items-center justify-between px-2">
          <span className="text-sm text-ink-muted">
            {t('pager.info', { page: data.number + 1, total: data.totalPages, count: data.totalElements })}
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
              className="rounded bg-line-soft px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {t('pager.prev')}
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="rounded bg-line-soft px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {t('pager.next')}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
