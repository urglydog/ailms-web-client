/**
 * Đánh số "Phần N: …" / "Bài N: …" cho mục lục khóa học. Nhãn theo NGÔN NGỮ CỦA KHÓA (không theo
 * ngôn ngữ giao diện): khóa tiếng Anh → "Section 1" / "Lesson 1", khóa tiếng Việt → "Phần 1" / "Bài 1".
 */

export type OutlineLang = 'vi' | 'en';

const VI_DIACRITICS = /[ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/i;
const ALREADY_NUMBERED = /^\s*(?:bài|phần|chương|lesson|section|part|chapter)\s*\d+\b/i;

/** Nhận diện từ mã ngôn ngữ ("vi", "en-US") hoặc nhãn ("Tiếng Việt", "Vietnamese"); không nhận ra → null. */
function fromHint(hint?: string | null): OutlineLang | null {
  const h = (hint ?? '').trim().toLowerCase();
  if (!h) return null;
  if (h.startsWith('vi') || h.includes('việt') || h.includes('viet')) return 'vi';
  if (h.startsWith('en') || h.includes('anh') || h.includes('english')) return 'en';
  return null;
}

/** Ngôn ngữ của khóa: ưu tiên mã/nhãn nguồn, không có thì suy từ tiêu đề (có dấu tiếng Việt → vi). */
export function detectOutlineLang(hint: string | null | undefined, titles: string[]): OutlineLang {
  return fromHint(hint) ?? (titles.some((t) => VI_DIACRITICS.test(t)) ? 'vi' : 'en');
}

const WORDS: Record<OutlineLang, { section: string; lesson: string }> = {
  vi: { section: 'Phần', lesson: 'Bài' },
  en: { section: 'Section', lesson: 'Lesson' },
};

/** "Phần 2: Tên" — giữ nguyên tiêu đề nếu đã tự có số ("Chương 1", "Part 2"…). */
export function sectionLabel(lang: OutlineLang, index: number, title: string): string {
  return ALREADY_NUMBERED.test(title) ? title : `${WORDS[lang].section} ${index}: ${title}`;
}

/** "Bài 5: Tên" — `index` đếm liên tục xuyên suốt khóa (không reset theo phần). */
export function lessonLabel(lang: OutlineLang, index: number, title: string): string {
  return ALREADY_NUMBERED.test(title) ? title : `${WORDS[lang].lesson} ${index}: ${title}`;
}
