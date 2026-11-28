import viMessages from '@/messages/vi.json';
import type { Locale } from '@/lib/stores/localeStore';

export type Messages = typeof viMessages;

/**
 * Hiệu năng (28/11/2026): mỗi file ngôn ngữ ~85KB gzip. Trước đây import tĩnh cả 4 nên MỌI trang tải
 * ~350KB bản dịch. Giờ chỉ `vi` (mặc định, cũng là ngôn ngữ render server/hydrate) nằm trong bundle;
 * en/zh/ja tách chunk riêng, chỉ tải khi người dùng thật sự chọn.
 */
const loaders: Record<Exclude<Locale, 'vi'>, () => Promise<{ default: Messages }>> = {
  en: () => import('@/messages/en.json') as Promise<{ default: Messages }>,
  zh: () => import('@/messages/zh.json') as Promise<{ default: Messages }>,
  ja: () => import('@/messages/ja.json') as Promise<{ default: Messages }>,
};

const loaded: Partial<Record<Locale, Messages>> = { vi: viMessages };

/** Bản dịch đã tải của `locale`, hoặc undefined nếu chưa tải xong. */
export function getLoadedMessages(locale: Locale): Messages | undefined {
  return loaded[locale];
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  const hit = loaded[locale];
  if (hit) return hit;
  const mod = await loaders[locale as Exclude<Locale, 'vi'>]();
  loaded[locale] = mod.default;
  return mod.default;
}
