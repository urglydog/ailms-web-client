import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Đăng nhập"
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-semibold text-accent no-underline hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-center text-sm text-ink-muted">Đang tải biểu mẫu...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
