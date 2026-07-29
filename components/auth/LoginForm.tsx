'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuthMutations';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password }, {
      onSuccess: () => {
        alert('Đăng nhập thành công!');
        // Dùng thư viện js-cookie hoặc Server Actions để lưu token. Tạm thời chuyển trang.
        router.push('/');
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { detail?: string } } };
        alert(error.response?.data?.detail || 'Đăng nhập thất bại');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 text-sm text-center">{((error as unknown) as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Đã có lỗi xảy ra'}</div>}
      <Input 
        id="email" label="Email" type="email" required 
        value={email} onChange={e => setEmail(e.target.value)} 
      />
      <Input 
        id="password" label="Mật khẩu" type="password" required 
        value={password} onChange={e => setPassword(e.target.value)} 
      />
      <Button type="submit" disabled={isPending} className="mt-2 w-full" size="lg">
        {isPending ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
