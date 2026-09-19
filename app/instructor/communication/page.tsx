'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** `/instructor/communication` mặc định vào tab "Hỏi đáp" — giống Udemy mở "Communication" luôn
 * vào "Q&A" trước tiên. */
export default function CommunicationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/communication/qa');
  }, [router]);

  return <div className="p-10 text-center text-sm text-gray-500">Đang chuyển hướng...</div>;
}
