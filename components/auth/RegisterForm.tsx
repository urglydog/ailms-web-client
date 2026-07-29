'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRegister, useVerifyOtp } from '@/hooks/useAuthMutations';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [otp, setOtp] = useState('');
  
  const { mutate: register, isPending: isRegistering, error: regError } = useRegister();
  const { mutate: verifyOtp, isPending: isVerifying, error: verifyError } = useVerifyOtp();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData, {
      onSuccess: () => setStep('otp'),
      onError: (err: any) => alert(err.response?.data?.detail || 'Lỗi đăng ký')
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtp({ email: formData.email, otpCode: otp }, {
      onSuccess: () => {
        alert('Tạo tài khoản thành công! Mời đăng nhập.');
        router.push('/login');
      },
      onError: (err: any) => alert(err.response?.data?.detail || 'OTP không hợp lệ')
    });
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        {verifyError && <div className="text-red-500 text-sm text-center">{(verifyError as any).response?.data?.detail || 'OTP không đúng'}</div>}
        <p className="text-sm text-ink-muted text-center mb-4">
          Vui lòng kiểm tra email <b>{formData.email}</b> để lấy mã OTP (6 chữ số).
        </p>
        <Input 
          id="otp" label="Mã OTP" required 
          value={otp} onChange={e => setOtp(e.target.value)} 
          placeholder="Ví dụ: 123456"
        />
        <Button type="submit" disabled={isVerifying} className="mt-4 w-full" size="lg">
          {isVerifying ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      {regError && <div className="text-red-500 text-sm text-center">{(regError as any).response?.data?.detail || 'Lỗi đăng ký'}</div>}
      <Input id="name" label="Họ tên" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Input id="email" label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      <Input id="password" label="Mật khẩu" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Vai trò</label>
        <select 
          className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
        >
          <option value="STUDENT">Học viên</option>
          <option value="INSTRUCTOR">Giảng viên</option>
        </select>
      </div>
      <Button type="submit" disabled={isRegistering} className="mt-4 w-full" size="lg">
        {isRegistering ? 'Đang xử lý...' : 'Tạo tài khoản'}
      </Button>
    </form>
  );
}
