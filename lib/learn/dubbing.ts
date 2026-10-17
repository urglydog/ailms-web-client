import type { DubLanguage } from '@/types/domain';

/**
 * Trạng thái hiển thị của một ngôn ngữ trong menu giọng lồng tiếng:
 * - `original-source`: trùng ngôn ngữ gốc của bài, không thể chọn (BR-DUB-09);
 * - `processing`: ngôn ngữ đang chạy job lồng tiếng (hệ thống chỉ theo dõi MỘT job đang chạy qua WebSocket,
 *   nên chỉ ngôn ngữ này mới có phần trăm);
 * - `ready`: đã có giọng, phát được ngay;
 * - `none`: chưa có giọng, chọn sẽ mở panel kích hoạt (UC18).
 */
export type LanguageStatus = 'original-source' | 'processing' | 'ready' | 'none';

export function languageStatus(
  lang: DubLanguage,
  ctx: { sourceLanguage: string | null; processingCode: string | null },
): LanguageStatus {
  if (lang.code === ctx.sourceLanguage) return 'original-source';
  if (lang.code === ctx.processingCode) return 'processing';
  return lang.available ? 'ready' : 'none';
}

/** Khi tắt "Nghe bản gốc": quay lại giọng đã chọn gần nhất nếu còn hợp lệ, không thì giọng đã sẵn sàng đầu tiên. */
export function languageToUseWhenOriginalOff(
  languages: DubLanguage[],
  sourceLanguage: string | null,
  lastCode: string | null,
): string | null {
  const usable = languages.filter((l) => l.code !== sourceLanguage);
  if (lastCode && usable.some((l) => l.code === lastCode)) return lastCode;
  return usable.find((l) => l.available)?.code ?? null;
}

/** Bỏ dấu và hạ chữ thường, để gõ "viet" vẫn khớp "Tiếng Việt". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

/** Lọc ô tìm ngôn ngữ theo tên hoặc mã, không phân biệt hoa thường và dấu. */
export function filterLanguages(languages: DubLanguage[], query: string): DubLanguage[] {
  const needle = fold(query.trim());
  if (!needle) return languages;
  return languages.filter((l) => fold(l.label).includes(needle) || fold(l.code).includes(needle));
}
