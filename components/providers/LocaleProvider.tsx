'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLocaleStore } from '@/lib/stores/localeStore';
import type { Locale } from '@/lib/stores/localeStore';
import { getLoadedMessages, loadMessages, type Messages } from '@/lib/i18n/messages';

/** Cấp bản dịch cho toàn app KHÔNG dùng tiền tố URL (`/en/...`) — trang này chủ yếu sau đăng
 * nhập, không cần SEO theo ngôn ngữ, nên đổi ngôn ngữ hoàn toàn ở client (đọc/ghi `localStorage`)
 * là đủ, tránh phải chuyển toàn bộ `app/` vào thư mục `[locale]` (rủi ro rất lớn cho 1 app đã có
 * hàng chục route). Trang render lần đầu (server + client trước khi hydrate) LUÔN là `vi` — xem
 * `localeStore.ts` — nên không có lỗi lệch nội dung hydrate. Ngôn ngữ khác tải lười (xem
 * `lib/i18n/messages.ts`); trong lúc tải vẫn hiển thị ngôn ngữ đang có để không nháy trắng. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);
  const [active, setActive] = useState<{ locale: Locale; messages: Messages }>(() => ({
    locale: 'vi',
    messages: getLoadedMessages('vi')!,
  }));

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    let cancelled = false;
    void loadMessages(locale).then((messages) => {
      if (!cancelled) setActive({ locale, messages });
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = active.locale;
  }, [active.locale]);

  return (
    <NextIntlClientProvider locale={active.locale} messages={active.messages} timeZone="Asia/Ho_Chi_Minh">
      {children}
    </NextIntlClientProvider>
  );
}
