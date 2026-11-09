'use client';

import { useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLocaleStore } from '@/lib/stores/localeStore';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import jaMessages from '@/messages/ja.json';
import type { Locale } from '@/lib/stores/localeStore';

const MESSAGES: Record<Locale, typeof viMessages> = {
  vi: viMessages,
  en: enMessages,
  zh: zhMessages,
  ja: jaMessages,
};

/** Cấp bản dịch cho toàn app KHÔNG dùng tiền tố URL (`/en/...`) — trang này chủ yếu sau đăng
 * nhập, không cần SEO theo ngôn ngữ, nên đổi ngôn ngữ hoàn toàn ở client (đọc/ghi `localStorage`)
 * là đủ, tránh phải chuyển toàn bộ `app/` vào thư mục `[locale]` (rủi ro rất lớn cho 1 app đã có
 * hàng chục route). Trang render lần đầu (server + client trước khi hydrate) LUÔN là `vi` — xem
 * `localeStore.ts` — nên không có lỗi lệch nội dung hydrate. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Ho_Chi_Minh">
      {children}
    </NextIntlClientProvider>
  );
}
