'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRegister, useVerifyOtp } from '@/hooks/useAuthMutations';
import { useRouter } from 'next/navigation';
import { Check, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MIN_ACCEPTED_SCORE, passwordStrength } from '@/lib/auth/passwordStrength';
import { PasswordField } from './PasswordField';
import { PasswordMatchHint, PasswordStrengthMeter } from './PasswordStrengthMeter';

type ApiErr = { response?: { data?: { detail?: string; message?: string } } };
const serverMessage = (err: unknown) => {
  const data = (err as ApiErr | null)?.response?.data;
  return data?.detail || data?.message;
};

/** Thanh tiến trình 2 bước Đăng ký → Xác thực OTP — thuần hiển thị. */
function StepIndicator({ step }: { step: 'register' | 'otp' }) {
  const t = useTranslations('auth.register');
  const steps: { key: 'register' | 'otp'; label: string }[] = [
    { key: 'register', label: t('stepInfo') },
    { key: 'otp', label: t('stepOtp') },
  ];
  return (
    <ol className="m-0 mb-5 flex list-none items-center gap-2 p-0">
      {steps.map((s, idx) => {
        const isDone = step === 'otp' && s.key === 'register';
        const isActive = step === s.key;
        return (
          <li key={s.key} aria-current={isActive ? 'step' : undefined} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                isDone ? 'bg-success text-white' : isActive ? 'bg-accent text-white' : 'bg-tint text-ink-muted'
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : idx + 1}
            </div>
            <span className={`text-xs font-medium ${isActive ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
            {idx < steps.length - 1 && <div className={`h-px flex-1 ${isDone ? 'bg-success' : 'bg-line'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');

  const { mutate: register, isPending: isRegPending, error: regError } = useRegister();
  const { mutate: verify, isPending: isVerifyPending, error: verifyError } = useVerifyOtp();

  const strength = passwordStrength(formData.password);
  const isMatch = formData.confirmPassword === formData.password;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (strength.score < MIN_ACCEPTED_SCORE) {
      setValidationError(t('strength.tooWeak'));
      return;
    }

    if (!isMatch) {
      setValidationError(t('match.mismatch'));
      return;
    }

    register(
      { fullName: formData.fullName, email: formData.email, password: formData.password },
      {
        onSuccess: () => setStep('otp'),
        onError: (err: unknown) => toast.error(serverMessage(err) || t('register.serverError')),
      },
    );
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verify({ email: formData.email, otp }, {
      onSuccess: () => {
        // Tự động chuyển hướng không dùng alert block
        router.push('/login?registered=true');
      },
      onError: (err: unknown) => toast.error(serverMessage(err) || t('register.otpInvalid')),
    });
  };

  if (step === 'otp') {
    return (
      <>
        <StepIndicator step={step} />
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          {verifyError && (
            <div role="alert" className="text-center text-sm text-danger">
              {serverMessage(verifyError) || t('register.otpInvalid')}
            </div>
          )}
          <div className="mb-2 flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tint text-accent">
              <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-sm text-ink-muted">
              {t.rich('register.otpIntro', { email: formData.email, b: (c) => <b className="text-ink">{c}</b> })}
            </p>
          </div>
          <Input id="otp" label={t('register.otpLabel')} required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
          <Button type="submit" disabled={isVerifyPending} className="mt-2 w-full">
            {isVerifyPending ? t('register.verifying') : t('register.verify')}
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <StepIndicator step={step} />
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {validationError && <div role="alert" className="text-center text-sm text-danger">{validationError}</div>}
        {regError && (
          <div role="alert" className="text-center text-sm text-danger">
            {serverMessage(regError) || t('register.connectionError')}
          </div>
        )}

        <Input id="fullName" label={t('fields.fullName')} required autoComplete="name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
        <Input id="email" label={t('fields.email')} type="email" required autoComplete="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />

        <div className="flex flex-col">
          <PasswordField id="password" label={t('fields.password')} required autoComplete="new-password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <div className="flex flex-col">
          <PasswordField id="confirmPassword" label={t('fields.confirmPassword')} required autoComplete="new-password" value={formData.confirmPassword} onChange={(v) => setFormData({ ...formData, confirmPassword: v })} />
          <PasswordMatchHint password={formData.password} confirm={formData.confirmPassword} />
        </div>

        <Button type="submit" disabled={isRegPending} className="mt-2 w-full">
          {isRegPending ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>
    </>
  );
}
