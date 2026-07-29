'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuthMutations';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Tài khoản đã được tạo thành công! Mời bạn đăng nhập.');
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    login({ email, password }, {
      onSuccess: (data: any) => {
        // Lưu token vào localStorage (Giai đoạn 1)
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data?.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Cập nhật lại giao diện (reload Header) và chuyển hướng
        window.location.href = '/'; 
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { detail?: string } } };
        alert(error.response?.data?.detail || 'Đăng nhập thất bại');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {successMessage && <div className="text-green-500 text-sm text-center font-medium">{successMessage}</div>}
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
