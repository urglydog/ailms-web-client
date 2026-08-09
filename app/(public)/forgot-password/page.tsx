'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Step1ForgotPassword from './step1';
import Step2ResetPassword from './step2';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(initialEmail);

  return (
    <div className="card w-full max-w-md p-8 border border-line bg-surface-raised rounded-2xl shadow-sm">
      <h1 className="font-display text-2xl font-bold text-ink mb-6 text-center">Quên Mật Khẩu</h1>

      {step === 1 ? (
        <Step1ForgotPassword
          initialEmail={email}
          onSuccess={(email) => {
            setEmail(email);
            setStep(2);
          }}
        />
      ) : (
        <Step2ResetPassword
          email={email}
          onSuccess={() => window.location.href = '/'}
        />
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <section className="shell flex min-h-[70vh] items-center justify-center py-16">
      <Suspense fallback={<div className="text-center text-sm text-ink-muted">Đang tải...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </section>
  );
}
