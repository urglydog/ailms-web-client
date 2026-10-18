'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ForgotEmailStep } from '@/components/auth/ForgotEmailStep';
import { ForgotResetStep } from '@/components/auth/ForgotResetStep';

function ForgotPasswordContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(initialEmail);

  return (
    <AuthLayout
      title={t('forgot.title')}
      footer={
        <Link href="/login" className="font-semibold text-accent-dark no-underline hover:underline">
          {t('forgot.backToLogin')}
        </Link>
      }
    >
      {step === 1 ? (
        <ForgotEmailStep
          initialEmail={email}
          onSuccess={(value) => {
            setEmail(value);
            setStep(2);
          }}
        />
      ) : (
        <ForgotResetStep email={email} onSuccess={() => (window.location.href = '/')} />
      )}
    </AuthLayout>
  );
}

function Loading() {
  const t = useTranslations('auth');
  return <div className="shell py-16 text-center text-sm text-ink-muted">{t('forgot.loading')}</div>;
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
