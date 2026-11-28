'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessagesInbox } from '@/components/messaging/MessagesInbox';

/** Hộp thư của Học viên (19/09/2026, tính năng mới) — bắt đầu từ nút "Nhắn tin giảng viên" ở
 * trang học bài (tab Tổng quan). Dùng chung {@link MessagesInbox} với phía Giảng viên
 * (`/instructor/communication/messages`), chỉ khác không có nút "Soạn tin nhắn" (học viên bắt
 * đầu hội thoại từ trang khóa học, không cần chọn người nhận ở đây). */
function MessagesPageContent() {
  const t = useTranslations('pages.messages');
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-5 font-display text-2xl font-bold text-ink">{t('title')}</h1>
      <MessagesInbox initialConversationId={conversationId ? Number(conversationId) : null} />
    </div>
  );
}

function MessagesFallback() {
  const t = useTranslations('pages.messages');
  return <div className="p-16 text-center text-sm text-ink-muted">{t('loading')}</div>;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesPageContent />
    </Suspense>
  );
}
