'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  return (
    <AuthLayout
      title={t('title')}
      footer={
        <>
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-accent-dark no-underline hover:underline">
            {t('signInNow')}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
