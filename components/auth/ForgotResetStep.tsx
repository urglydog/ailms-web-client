'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MIN_ACCEPTED_SCORE, passwordStrength } from '@/lib/auth/passwordStrength';
import { PasswordField } from './PasswordField';
import { PasswordMatchHint, PasswordStrengthMeter } from './PasswordStrengthMeter';

interface ForgotResetStepProps {
  email: string;
  onSuccess: () => void;
}

/** Bước 2 của quên mật khẩu: nhập OTP và mật khẩu mới. Thành công thì đăng nhập luôn bằng token trả về. */
export function ForgotResetStep({ email, onSuccess }: ForgotResetStepProps) {
  const t = useTranslations('auth');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = passwordStrength(newPassword);
  const isMatch = confirmPassword === newPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (strength.score < MIN_ACCEPTED_SCORE) {
      setError(t('strength.tooWeak'));
      return;
    }

    if (!isMatch) {
      setError(t('match.mismatch'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || t('forgot.generic'));
      }

      const data = await res.json();
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      toast.success(t('forgot.success'));
      setTimeout(() => {
        onSuccess();
      }, 2000); // Khoảng delay 2 giây
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgot.generic'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="otp"
        label={t('forgot.otpLabel')}
        type="text"
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        className="text-center text-lg tracking-widest"
      />
      <p className="-mt-2 text-xs text-ink-muted">{t('forgot.otpHint')}</p>

      <div className="flex flex-col">
        <PasswordField
          id="newPassword"
          label={t('forgot.newPassword')}
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder={t('forgot.newPasswordPh')}
        />
        <PasswordStrengthMeter password={newPassword} />
      </div>

      <div className="flex flex-col">
        <PasswordField
          id="confirmPassword"
          label={t('fields.confirmPassword')}
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t('forgot.confirmPh')}
        />
        <PasswordMatchHint password={newPassword} confirm={confirmPassword} />
      </div>

      {error && (
        <div role="alert" className="text-center text-sm font-medium text-danger">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="mt-2 w-full" size="lg">
        {loading ? t('forgot.processing') : t('forgot.reset')}
      </Button>
    </form>
  );
}
