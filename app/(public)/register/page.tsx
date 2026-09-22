import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-accent no-underline hover:underline">
            Đăng nhập ngay
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
