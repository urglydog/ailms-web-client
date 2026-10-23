'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuthMutations';
import { useSearchParams } from 'next/navigation';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordField } from './PasswordField';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registered, setRegistered] = useState(false);
  const { mutate: login, isPending, error } = useLogin();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setRegistered(true);
  }, [searchParams]);

  // (23/10/2026, sửa bug thật) — trước đây bị văng về /login giữa phiên (vd tài khoản vừa bị
  // Admin khóa) hoàn toàn im lặng, không một lời giải thích — xem lib/api/client.ts#fetchWithRefresh.
  useEffect(() => {
    try {
      const reason = sessionStorage.getItem('loginKickReason');
      if (reason) {
        sessionStorage.removeItem('loginKickReason');
        toast.error(reason);
      }
    } catch {
      /* Safari riêng tư chặn sessionStorage — bỏ qua */
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistered(false);
    login({ email, password }, {
      onSuccess: (data: { accessToken?: string; refreshToken?: string }) => {
        // Lưu token vào localStorage (Giai đoạn 1)
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data?.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        // (19/09/2026, sửa theo yêu cầu) — Giảng viên đăng nhập giờ cũng về trang chủ như Học
        // viên, KHÔNG còn tự động nhảy thẳng vào trang quản lý khóa học nữa (muốn vào thì tự bấm
        // "Kênh Giảng viên" ở dropdown avatar). Chỉ còn Admin có trang đích riêng vì đó không
        // phải trang có ý nghĩa với vai trò khác.
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
        toast.error(error.response?.data?.message || error.response?.data?.detail || t('login.failed'));
      }
    });
  };

  const errorDetail = error
    ? ((error as unknown) as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('login.generic')
    : null;

  return (
    <div className="flex flex-col gap-4">
      {registered && (
        <div role="status" className="flex items-center justify-center gap-1.5 rounded-lg bg-success-tint px-3 py-2 text-center text-sm font-medium text-success-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {t('login.registered')}
        </div>
      )}
      {errorDetail && <div role="alert" className="text-center text-sm text-danger">{errorDetail}</div>}

      {/* Google Sign-In Button */}
      <GoogleSignInButton />

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface-raised px-2 text-ink-muted">{t('login.orEmail')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email" label={t('fields.email')} type="email" required autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id="password" label={t('fields.password')} required autoComplete="current-password"
            value={password} onChange={setPassword}
          />
          <div className="flex justify-end">
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              onClick={(e) => {
                if (!email) {
                  e.preventDefault();
                  toast.error(t('login.forgotNeedEmail'));
                  document.getElementById('email')?.focus();
                }
              }}
              className="text-sm font-semibold text-accent-dark no-underline hover:underline"
            >
              {t('login.forgot')}
            </Link>
          </div>
        </div>
        <Button type="submit" disabled={isPending} className="mt-2 w-full" size="lg">
          {isPending ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>
    </div>
  );
}
