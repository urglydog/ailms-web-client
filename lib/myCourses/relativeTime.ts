import { formatDistance } from 'date-fns';
import { enUS, ja, vi, zhCN } from 'date-fns/locale';

const LOCALES = { vi, en: enUS, zh: zhCN, ja } as const;

/** "2 giờ trước" / "3 days ago" theo ngôn ngữ giao diện; ngôn ngữ lạ thì lùi về tiếng Việt. */
export function formatRelative(iso: string, locale: string, now: Date = new Date()): string {
  const dateFnsLocale = LOCALES[locale as keyof typeof LOCALES] ?? vi;
  return formatDistance(new Date(iso), now, { addSuffix: true, locale: dateFnsLocale });
}
