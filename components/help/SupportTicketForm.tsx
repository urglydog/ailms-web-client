'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api/client';
import { supportApi } from '@/lib/api/support';
import type { SupportCategory } from '@/types/domain';

const CATEGORIES: SupportCategory[] = ['ACCOUNT', 'PAYMENT', 'COURSE', 'EXAM', 'TECHNICAL', 'OTHER'];
/** Khớp `lms.rules.max-support-ticket-files` / `max-support-ticket-size-mb` phía BE — BE vẫn kiểm tra lại, đây chỉ để báo sớm. */
const MAX_FILES = 3;
const MAX_SIZE_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const INPUT_CLASS = 'w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent';

interface Props {
  initialCategory: SupportCategory;
  initialEmail?: string;
  /** Tiêu đề đã chốt theo mục người dùng chọn ở Trung tâm trợ giúp (vd "Tài khoản › Không nhận được OTP") — khóa, không cho sửa. */
  lockedSubject?: string;
}

/** Form gửi ticket hỗ trợ — gửi được cả khi chưa đăng nhập. Hiện mã ticket sau khi gửi thành công. */
export function SupportTicketForm({ initialCategory, initialEmail = '', lockedSubject }: Props) {
  const t = useTranslations('supportHelp');
  const fileInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState<SupportCategory>(initialCategory);
  const [subject, setSubject] = useState(lockedSubject ?? '');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const file of Array.from(picked)) {
      if (!ACCEPTED.includes(file.type)) {
        setFileError(t('form.badType', { name: file.name }));
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setFileError(t('form.tooBig', { name: file.name, size: MAX_SIZE_MB }));
        return;
      }
      next.push(file);
    }
    if (next.length > MAX_FILES) {
      setFileError(t('form.tooMany', { count: MAX_FILES }));
      return;
    }
    setFileError(null);
    setFiles(next);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await supportApi.create({ email: email.trim(), category, subject: subject.trim(), message: message.trim() }, files);
      setCode(res.code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('form.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCode(null);
    setSubject(lockedSubject ?? '');
    setMessage('');
    setFiles([]);
  };

  if (code) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success-tint p-5">
        <h3 className="m-0 font-display text-base font-bold text-success-ink">{t('form.successTitle')}</h3>
        <p className="m-0 text-sm text-ink">{t('form.successBody', { code })}</p>
        <button type="button" onClick={reset} className="w-fit rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface">
          {t('form.newRequest')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
      <h3 className="m-0 font-display text-base font-bold text-ink">{t('form.title')}</h3>
      {error && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{t('form.email')}</span>
        <input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} />
      </label>

      {lockedSubject ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">{t('form.topic')}</span>
          <p className="m-0 rounded-lg border border-line bg-surface p-2.5 text-sm font-medium text-ink">{lockedSubject}</p>
          <span className="text-xs text-ink-muted">{t('form.topicHint')}</span>
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('form.category')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)} className={INPUT_CLASS}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}.title`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{t('form.subject')}</span>
            <input type="text" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} className={INPUT_CLASS} />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">{lockedSubject ? t('form.messageGuided') : t('form.message')}</span>
        <textarea required minLength={10} maxLength={3000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={INPUT_CLASS} />
        <span className="text-xs text-ink-muted">{t('form.messageHint')}</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">{t('form.attach')}</span>
        <span className="text-xs text-ink-muted">{t('form.attachHint', { count: MAX_FILES, size: MAX_SIZE_MB })}</span>
        <input ref={fileInput} type="file" accept={ACCEPTED.join(',')} multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={files.length >= MAX_FILES}
          title={t('form.attachHint', { count: MAX_FILES, size: MAX_SIZE_MB })}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50"
        >
          <ImagePlus size={14} aria-hidden />
          {t('form.addFiles')}
        </button>
        {fileError && <p role="alert" className="m-0 text-xs text-danger">{fileError}</p>}
        {files.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink">
                <span className="truncate">{file.name}</span>
                <button type="button" aria-label={`${t('form.remove')}: ${file.name}`} onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="shrink-0 rounded p-1 text-ink-muted hover:text-ink">
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
        {submitting ? t('form.submitting') : t('form.submit')}
      </button>
    </form>
  );
}
