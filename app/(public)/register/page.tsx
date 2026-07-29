import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <section className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 border border-line bg-surface-raised rounded-2xl shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink mb-6 text-center">Đăng ký tài khoản</h1>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-accent no-underline hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </section>
  );
}
