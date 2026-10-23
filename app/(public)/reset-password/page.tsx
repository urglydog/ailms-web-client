'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { api, ApiError } from '@/lib/api/client';

/** Consume link do Admin tự gửi thủ công qua `POST /api/v1/admin/users/{id}/send-reset-link`
 * (khác hẳn flow OTP email ở /forgot-password — dùng khi email/OTP không tới được user). */
function ResetPasswordContent() {
  const t = useTranslations('auth.resetByToken');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/auth/reset-password-by-token', { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title={t('title')} footer={<Link href="/login" className="font-semibold text-accent-dark no-underline hover:underline">{t('backToLogin')}</Link>}>
        <p className="text-sm text-danger">{t('missingToken')}</p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title={t('title')} footer={<Link href="/login" className="font-semibold text-accent-dark no-underline hover:underline">{t('backToLogin')}</Link>}>
        <p className="text-sm text-success-ink">{t('success')}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('title')} footer={<Link href="/login" className="font-semibold text-accent-dark no-underline hover:underline">{t('backToLogin')}</Link>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">{t('newPassword')}</span>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </AuthLayout>
  );
}

function Loading() {
  return <div className="shell py-16 text-center text-sm text-ink-muted">...</div>;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
