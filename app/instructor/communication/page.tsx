'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** `/instructor/communication` mặc định vào tab "Hỏi đáp" — giống Udemy mở "Communication" luôn
 * vào "Q&A" trước tiên. */
export default function CommunicationRedirectPage() {
  const t = useTranslations('instructor.common');
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/communication/qa');
  }, [router]);

  return <div className="p-10 text-center text-sm text-ink-muted">{t('redirecting')}</div>;
}
