'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Step2Props {
  email: string;
  onSuccess: () => void;
}

export default function Step2ResetPassword({ email, onSuccess }: Step2Props) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
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
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Có lỗi xảy ra');
      }

      const data = await res.json();
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="otp"
        label="OTP"
        type="text"
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
        maxLength={6}
        placeholder="000000"
        className="text-center text-lg tracking-widest"
      />
      <p className="text-xs text-ink-muted -mt-2">Nhập 6 chữ số OTP từ email</p>

      <Input
        id="newPassword"
        label="Mật khẩu mới"
        type="password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nhập mật khẩu mới (≥ 8 ký tự)"
      />

      <Input
        id="confirmPassword"
        label="Xác nhận mật khẩu"
        type="password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Xác nhận mật khẩu mới"
      />

      {error && (
        <div className="text-red-500 text-sm text-center font-medium">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="mt-2 w-full"
        size="lg"
      >
        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
      </Button>
    </form>
  );
}
