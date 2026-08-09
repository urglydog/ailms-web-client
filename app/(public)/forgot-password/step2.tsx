'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface Step2Props {
  email: string;
  onSuccess: () => void;
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: 'bg-line', textColor: 'text-ink-muted' };
  if (password.length < 6) return { score: 1, label: 'Quá ngắn (tối thiểu 6 ký tự)', color: 'bg-red-500', textColor: 'text-red-500' };
  
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&.]/.test(password);
  
  if (hasLetter && hasNumber && hasSpecial && password.length >= 8) {
    return { score: 4, label: 'Mạnh (Tuyệt vời!)', color: 'bg-green-500', textColor: 'text-green-500' };
  }
  if (hasLetter && hasNumber) {
    return { score: 3, label: 'Tốt', color: 'bg-accent', textColor: 'text-accent' };
  }
  
  return { score: 2, label: 'Yếu (Cần cả chữ và số)', color: 'bg-orange-500', textColor: 'text-orange-500' };
}

export default function Step2ResetPassword({ email, onSuccess }: Step2Props) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(newPassword);
  const isMatch = confirmPassword === newPassword;
  const showMatchStatus = confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (strength.score < 3) {
      setError('Mật khẩu chưa đủ mạnh. Vui lòng nhập ít nhất 6 ký tự gồm cả chữ cái và chữ số.');
      return;
    }

    if (!isMatch) {
      setError('Mật khẩu xác nhận không khớp.');
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
      
      toast.success('Đổi mật khẩu thành công! Bạn sẽ được chuyển về trang chủ.');
      setTimeout(() => {
        onSuccess();
      }, 2000); // Khoảng delay 2 giây
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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

      <div className="flex flex-col gap-1">
        <Input
          id="newPassword"
          label="Mật khẩu mới"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới"
        />
        {/* Password Strength Meter */}
        <div className={`transition-all duration-300 overflow-hidden ${newPassword.length > 0 ? 'h-8 opacity-100 mt-1' : 'h-0 opacity-0'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-ink-muted">Mức độ bảo mật:</span>
            <span className={`text-[11px] font-semibold ${strength.textColor}`}>{strength.label}</span>
          </div>
          <div className="flex gap-1 h-1 w-full">
            {[1, 2, 3, 4].map((level) => (
              <div 
                key={level} 
                className={`flex-1 rounded-full transition-colors duration-500 ${level <= strength.score ? strength.color : 'bg-surface-raised'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="confirmPassword"
          label="Xác nhận mật khẩu"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Xác nhận mật khẩu mới"
        />
        {/* Confirm Password Match Indicator */}
        <div className={`transition-all duration-300 overflow-hidden ${showMatchStatus ? 'h-4 opacity-100 mt-1' : 'h-0 opacity-0'}`}>
          <span className={`text-[11px] font-semibold ${isMatch ? 'text-green-500' : 'text-red-500'}`}>
            {isMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
          </span>
        </div>
      </div>

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
