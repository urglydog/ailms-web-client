'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRegister, useVerifyOtp } from '@/hooks/useAuthMutations';
import { useRouter } from 'next/navigation';

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

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const { mutate: register, isPending: isRegPending, error: regError } = useRegister();
  const { mutate: verify, isPending: isVerifyPending, error: verifyError } = useVerifyOtp();

  const strength = getPasswordStrength(formData.password);
  
  // Trạng thái khớp của Confirm Password
  const isMatch = formData.confirmPassword === formData.password;
  const showMatchStatus = formData.confirmPassword.length > 0;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (strength.score < 3) {
      setValidationError('Mật khẩu chưa đủ mạnh. Vui lòng nhập ít nhất 6 ký tự gồm cả chữ cái và chữ số.');
      return;
    }
    
    if (!isMatch) {
      setValidationError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password
    };

    register(payload, {
      onSuccess: () => setStep('otp'),
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { detail?: string, message?: string } } };
        alert(error.response?.data?.detail || error.response?.data?.message || 'Lỗi đăng ký từ máy chủ');
      }
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verify({ email: formData.email, otp }, {
      onSuccess: () => {
        // Tự động chuyển hướng không dùng alert block
        router.push('/login?registered=true');
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { detail?: string, message?: string } } };
        alert(error.response?.data?.detail || error.response?.data?.message || 'OTP không hợp lệ');
      }
    });
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        {verifyError && <div className="text-red-500 text-sm text-center">{((verifyError as unknown) as { response?: { data?: { detail?: string, message?: string } } }).response?.data?.detail || ((verifyError as unknown) as { response?: { data?: { message?: string } } }).response?.data?.message || 'OTP không đúng'}</div>}
        <p className="text-sm text-ink-muted text-center mb-4">
          Vui lòng kiểm tra email <b>{formData.email}</b> để lấy mã OTP (6 chữ số).
        </p>
        <Input id="otp" label="Mã OTP" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
        <Button type="submit" disabled={isVerifyPending} className="mt-2 w-full">
          {isVerifyPending ? 'Đang xác thực...' : 'Xác thực'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      {validationError && <div className="text-red-500 text-sm text-center">{validationError}</div>}
      {regError && <div className="text-red-500 text-sm text-center">{((regError as unknown) as { response?: { data?: { detail?: string, message?: string } } }).response?.data?.detail || ((regError as unknown) as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi kết nối đến máy chủ. Vui lòng thử lại.'}</div>}
      
      <Input id="fullName" label="Họ tên" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
      <Input id="email" label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      
      <div className="flex flex-col gap-1">
        <Input id="password" label="Mật khẩu" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        {/* Password Strength Meter */}
        <div className={`transition-all duration-300 overflow-hidden ${formData.password.length > 0 ? 'h-8 opacity-100 mt-1' : 'h-0 opacity-0'}`}>
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
        <Input id="confirmPassword" label="Xác nhận mật khẩu" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
        {/* Confirm Password Match Indicator */}
        <div className={`transition-all duration-300 overflow-hidden ${showMatchStatus ? 'h-4 opacity-100 mt-1' : 'h-0 opacity-0'}`}>
          <span className={`text-[11px] font-semibold ${isMatch ? 'text-green-500' : 'text-red-500'}`}>
            {isMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
          </span>
        </div>
      </div>
      
      <Button type="submit" disabled={isRegPending} className="mt-2 w-full">
        {isRegPending ? 'Đang xử lý...' : 'Đăng ký'}
      </Button>
    </form>
  );
}
