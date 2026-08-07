'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuthMutations';
import { useSearchParams } from 'next/navigation';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginForm() {

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
      onSuccess: (data: { accessToken?: string; refreshToken?: string }) => {
        // Lưu token vào localStorage (Giai đoạn 1)
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data?.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        let targetUrl = '/';
        if (data?.accessToken) {
          try {
            const payload = data.accessToken.split('.')[1];
            if (payload) {
              const decoded = JSON.parse(atob(payload));
              let roleStr = '';
              if (typeof decoded.role === 'string') roleStr = decoded.role;
              else if (Array.isArray(decoded.roles)) roleStr = decoded.roles[0] || '';
              else if (typeof decoded.roles === 'string') roleStr = decoded.roles;
              else if (Array.isArray(decoded.authorities)) roleStr = decoded.authorities.map((a: Record<string, unknown> | string) => (typeof a === 'string' ? a : (a as {authority?: string}).authority || '')).join(',');
              else if (typeof decoded.authorities === 'string') roleStr = decoded.authorities;

              if (roleStr.includes('ADMIN')) {
                targetUrl = '/admin';
              } else if (roleStr.includes('INSTRUCTOR')) {
                targetUrl = '/instructor';
              }
            }
          } catch (e) {
            console.error('Lỗi giải mã token lúc đăng nhập:', e);
          }
        }
        
        // Cập nhật lại giao diện (reload) và chuyển hướng
        window.location.href = targetUrl; 
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { detail?: string, message?: string } } };
        alert(error.response?.data?.message || error.response?.data?.detail || 'Đăng nhập thất bại');
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {successMessage && <div className="text-green-500 text-sm text-center font-medium">{successMessage}</div>}
      {error && <div className="text-red-500 text-sm text-center">{((error as unknown) as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Đã có lỗi xảy ra'}</div>}

      {/* Google Sign-In Button */}
      <GoogleSignInButton />

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface-raised text-ink-muted">hoặc đăng nhập với email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
    </div>
  );
}
