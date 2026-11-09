import { Suspense } from 'react';
import { HelpCenter } from '@/components/help/HelpCenter';

/** Trung tâm trợ giúp — FAQ theo nhóm vấn đề + form gửi ticket hỗ trợ (05/11/2026). `useSearchParams`
 * (đọc `?category=`) bắt buộc nằm trong Suspense khi prerender. */
export default function HelpPage() {
  return (
    <Suspense fallback={null}>
      <HelpCenter />
    </Suspense>
  );
}
