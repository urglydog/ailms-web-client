'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <AuthLayout
      title={t('title')}
      footer={
        <>
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-accent-dark no-underline hover:underline">
            {t('signUpNow')}
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-center text-sm text-ink-muted">{t('loading')}</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
