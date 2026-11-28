import { enUS, ja, vi, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const LOCALES: Record<string, Locale> = { vi, en: enUS, zh: zhCN, ja };

/** date-fns locale theo ngôn ngữ giao diện (next-intl); ngôn ngữ lạ thì lùi về tiếng Việt. */
export function getDateFnsLocale(locale: string): Locale {
  return LOCALES[locale] ?? vi;
}
