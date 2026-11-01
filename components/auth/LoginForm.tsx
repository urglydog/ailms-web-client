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
  const [kickReason, setKickReason] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setRegistered(true);
  }, [searchParams]);

  // (23/10/2026, sửa bug thật) — trước đây bị văng về /login giữa phiên (vd tài khoản vừa bị
  // Admin khóa) hoàn toàn im lặng, không một lời giải thích — xem lib/api/client.ts#fetchWithRefresh.
  // Hiện NGAY thành khung đỏ cố định trong form, KHÔNG phải toast — phải thấy được trước khi
  // user kịp bấm đăng nhập lại, không phải chờ bấm xong mới biết (toast tự biến mất, dễ bỏ lỡ).
  useEffect(() => {
    try {
      const reason = sessionStorage.getItem('loginKickReason');
      if (reason) {
        sessionStorage.removeItem('loginKickReason');
        setKickReason(reason);
      }
    } catch {
      /* Safari riêng tư chặn sessionStorage — bỏ qua */
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistered(false);
    setKickReason(null);
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
    });
  };

  // (23/10/2026, sửa bug thật) — trước đây VỪA hiện khung đỏ này VỪA bắn toast.error trùng lặp
  // y hệt nội dung cho cùng 1 lỗi đăng nhập sai — chỉ cần 1 chỗ hiện, dùng khung cố định trong
  // form (không tự biến mất như toast) theo đúng yêu cầu.
  const errorDetail = error
    ? ((error as unknown) as { response?: { data?: { detail?: string, message?: string } } })?.response?.data?.message
      || ((error as unknown) as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      || t('login.generic')
    : null;

  // (23/10/2026, sửa theo yêu cầu) — khi đã biết chắc vừa bị văng vì lý do xác thực (vd tài
  // khoản bị khóa), không để form trông như "thử lại là được" — ẩn hẳn input/nút đăng nhập,
  // chỉ còn khung đỏ + nút "Thử lại" rõ ràng (user tự bấm khi chắc chắn vấn đề đã được xử lý,
  // thay vì gõ lại email/password vô ích).
  if (kickReason) {
    return (
      <div className="flex flex-col gap-4">
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm font-medium text-danger">
          {kickReason}
        </div>
        <Button type="button" onClick={() => setKickReason(null)} className="w-full" size="lg">
          {t('login.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {registered && (
        <div role="status" className="flex items-center justify-center gap-1.5 rounded-lg bg-success-tint px-3 py-2 text-center text-sm font-medium text-success-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {t('login.registered')}
        </div>
      )}
      {errorDetail && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-center text-sm font-medium text-danger">
          {errorDetail}
        </div>
      )}

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
