import { createTranslator } from 'next-intl';
import { useLocaleStore, type Locale } from '@/lib/stores/localeStore';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import jaMessages from '@/messages/ja.json';

const MESSAGES: Record<Locale, typeof viMessages> = {
  vi: viMessages,
  en: enMessages,
  zh: zhMessages,
  ja: jaMessages,
};

type Translate = (key: string, values?: Record<string, string | number>) => string;
const cache = new Map<Locale, Translate>();

/**
 * Dịch ngoài React (lib/, hook callback, lớp API) theo ngôn ngữ giao diện hiện tại trong `useLocaleStore`.
 * `key` là đường dẫn đầy đủ, ví dụ `errors.api.networkError`. Trong component vẫn ưu tiên `useTranslations`.
 */
export function tr(key: string, values?: Record<string, string | number>): string {
  const locale = useLocaleStore.getState().locale;
  let t = cache.get(locale);
  if (!t) {
    t = createTranslator({ locale, messages: MESSAGES[locale] }) as unknown as Translate;
    cache.set(locale, t);
  }
  return t(key, values);
}
