'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Step = 'cart' | 'payment';

/** Thanh tiến trình hai bước của luồng mua hàng: Giỏ hàng, rồi Thanh toán. */
export function CheckoutSteps({ current }: { current: Step }) {
  const t = useTranslations('shop.steps');
  const steps: Step[] = ['cart', 'payment'];
  const currentIndex = steps.indexOf(current);

  return (
    <nav aria-label={t('aria')} className="mb-6">
      <ol className="m-0 flex list-none items-center gap-3 p-0 text-sm font-semibold">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step} aria-current={active ? 'step' : undefined} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    done || active ? 'bg-accent text-white' : 'bg-tint text-ink-muted'
                  }`}
                >
                  {done ? <Check size={13} aria-hidden /> : i + 1}
                </span>
                <span className={active ? 'text-ink' : 'text-ink-muted'}>{t(step)}</span>
              </span>
              {i < steps.length - 1 && <span aria-hidden className="h-px w-10 bg-line" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
