'use client';

import { useTranslations } from 'next-intl';
import { ComposeMessageButton } from '@/components/instructor/communication/ComposeMessageButton';
import { MessagesInbox } from '@/components/messaging/MessagesInbox';

/** "Giao tiếp > Tin nhắn" (19/09/2026, xây mới). */
export default function InstructorMessagesPage() {
  const t = useTranslations('instructor.comm.messages');
  return (
    <>
      <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('title')}</h1>
      <MessagesInbox composeSlot={<ComposeMessageButton />} />
    </>
  );
}
