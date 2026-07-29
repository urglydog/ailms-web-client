import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <section className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 border border-line bg-surface-raised rounded-2xl shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink mb-6 text-center">Đăng nhập</h1>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-semibold text-accent no-underline hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </section>
  );
}
