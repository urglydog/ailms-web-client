'use client';

import { useState } from 'react';
import Step1ForgotPassword from './step1';
import Step2ResetPassword from './step2';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');

  return (
    <section className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-6 text-center">Quên Mật Khẩu</h1>

        {step === 1 ? (
          <Step1ForgotPassword
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
    </section>
  );
}
