import { createTranslator } from 'next-intl';
import { useLocaleStore, type Locale } from '@/lib/stores/localeStore';
import { getLoadedMessages } from '@/lib/i18n/messages';

type Translate = (key: string, values?: Record<string, string | number>) => string;
const cache = new Map<Locale, Translate>();

/**
 * Dịch ngoài React (lib/, hook callback, lớp API) theo ngôn ngữ giao diện hiện tại trong `useLocaleStore`.
 * `key` là đường dẫn đầy đủ, ví dụ `errors.api.networkError`. Trong component vẫn ưu tiên `useTranslations`.
 */
export function tr(key: string, values?: Record<string, string | number>): string {
  const wanted = useLocaleStore.getState().locale;
  // Ngôn ngữ chưa tải xong (LocaleProvider đang tải) thì tạm dùng vi — luôn có sẵn trong bundle.
  const locale: Locale = getLoadedMessages(wanted) ? wanted : 'vi';
  let t = cache.get(locale);
  if (!t) {
    t = createTranslator({ locale, messages: getLoadedMessages(locale)! }) as unknown as Translate;
    cache.set(locale, t);
  }
  return t(key, values);
}
