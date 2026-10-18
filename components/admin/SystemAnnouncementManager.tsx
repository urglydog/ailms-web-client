'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCreateSystemAnnouncement, useSystemAnnouncements } from '@/hooks/useSystemAnnouncements';
import { ApiError } from '@/lib/api/client';
import type { AnnouncementAudience, AnnouncementSeverity, CreateSystemAnnouncementReq } from '@/types/domain';

const SEVERITY_OPTIONS: AnnouncementSeverity[] = ['HIGH', 'MEDIUM', 'LOW'];
const AUDIENCE_OPTIONS: AnnouncementAudience[] = ['ALL', 'INSTRUCTOR', 'STUDENT', 'SPECIFIC_USER'];
const DISPATCH_STATUSES = ['PENDING', 'PROCESSING', 'DONE', 'FAILED'];

const SEVERITY_BADGE_CLASS: Record<AnnouncementSeverity, string> = {
  HIGH: 'bg-white text-danger border-danger/40',
  MEDIUM: 'bg-white text-ink border-warning',
  LOW: 'bg-line-soft text-ink-muted border-line',
};

/** Thông báo hệ thống từ Admin (26/09/2026, tính năng mới) — phát tán qua job nền Redis
 * (`SystemAnnouncementService` phía backend), form này chỉ tạo bản ghi + đẩy job rồi trả về
 * ngay, KHÔNG chờ gửi xong cho toàn bộ người nhận — xem cột "Trạng thái" ở bảng lịch sử. */
export function SystemAnnouncementManager() {
  const t = useTranslations('admin.announce');
  const locale = useLocale();
  const { data: announcements, isLoading } = useSystemAnnouncements();
  const createAnnouncement = useCreateSystemAnnouncement();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('MEDIUM');
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);

    const req: CreateSystemAnnouncementReq = {
      title: title.trim(),
      content: content.trim(),
      severity,
      audience,
      targetUserId: audience === 'SPECIFIC_USER' && targetUserId ? Number(targetUserId) : null,
      expiresAt: severity === 'HIGH' && expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    createAnnouncement.mutate(req, {
      onSuccess: () => {
        setTitle('');
        setContent('');
        setTargetUserId('');
        setExpiresAt('');
      },
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('form.error')),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('form.title')}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('form.titlePh')}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label={t('form.severity')}>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{t(`severity.${opt}`)}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t('form.content')}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('form.audience')}>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{t(`audience.${opt}`)}</option>
              ))}
            </select>
          </Field>

          {audience === 'SPECIFIC_USER' && (
            <Field label={t('form.userId')}>
              <input
                type="number"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                min={1}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </Field>
          )}

          {severity === 'HIGH' && (
            <Field label={t('form.expires')}>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </Field>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-white p-3 text-[12.5px] text-danger">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={createAnnouncement.isPending}
          className="self-start rounded-full bg-accent px-6 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {createAnnouncement.isPending ? t('form.sending') : t('form.send')}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.title')}</th>
              <th className="px-6 py-4">{t('cols.severity')}</th>
              <th className="px-6 py-4">{t('cols.audience')}</th>
              <th className="px-6 py-4">{t('cols.status')}</th>
              <th className="px-6 py-4">{t('cols.sent')}</th>
              <th className="px-6 py-4">{t('cols.created')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-muted">{t('loading')}</td>
              </tr>
            )}
            {!isLoading && announcements?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-muted">{t('empty')}</td>
              </tr>
            )}
            {announcements?.map((a) => (
              <tr key={a.id} className="hover:bg-surface">
                <td className="px-6 py-3 font-semibold text-ink">{a.title}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${SEVERITY_BADGE_CLASS[a.severity]}`}>
                    {t(`sevLabel.${a.severity}`)}
                  </span>
                </td>
                <td className="px-6 py-3 text-ink-muted">
                  {a.audience === 'SPECIFIC_USER' ? t('user', { id: a.targetUserId ?? 0 }) : t(`audience.${a.audience}`)}
                </td>
                <td className="px-6 py-3 text-ink-muted">{DISPATCH_STATUSES.includes(a.dispatchStatus) ? t(`dispatch.${a.dispatchStatus}`) : a.dispatchStatus}</td>
                <td className="px-6 py-3 text-ink-muted">{a.sentCount}{a.totalRecipients != null ? ` / ${a.totalRecipients}` : ''}</td>
                <td className="px-6 py-3 text-ink-muted">{new Date(a.createdAt).toLocaleString(locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
