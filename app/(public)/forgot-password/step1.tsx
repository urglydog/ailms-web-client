'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Step1Props {
  onSuccess: (email: string) => void;
}

export default function Step1ForgotPassword({ onSuccess }: Step1Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Có lỗi xảy ra');
      }

      onSuccess(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="email"
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập email của bạn"
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
        {loading ? 'Đang gửi...' : 'Gửi OTP'}
      </Button>
    </form>
  );
}
