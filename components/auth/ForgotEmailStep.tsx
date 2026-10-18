'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ForgotEmailStepProps {
  initialEmail?: string;
  onSuccess: (email: string) => void;
}

/** Bước 1 của quên mật khẩu: nhập email để nhận mã OTP. */
export function ForgotEmailStep({ initialEmail = '', onSuccess }: ForgotEmailStepProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || t('forgot.generic'));
      }

      onSuccess(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgot.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-muted">{t('forgot.intro')}</p>
      <Input
        id="email"
        label={t('fields.email')}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('forgot.emailPh')}
      />
      {error && (
        <div role="alert" className="text-center text-sm font-medium text-danger">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading} className="mt-2 w-full" size="lg">
        {loading ? t('forgot.sending') : t('forgot.send')}
      </Button>
    </form>
  );
}
