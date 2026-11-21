/**
 * Chuẩn hóa nhãn ngôn ngữ để hiển thị (UI v2, A8): dữ liệu có thể là mã ("en", "vi-VN"), tên tiếng Anh
 * viết thường ("english") hoặc đã là tên đầy đủ ("Tiếng Việt (Việt Nam)"). Trả về tên tiếng Việt
 * qua `Intl.DisplayNames`; không nhận ra thì chỉ viết hoa chữ cái đầu.
 */
const NAME_TO_CODE: Record<string, string> = {
  english: 'en', vietnamese: 'vi', japanese: 'ja', korean: 'ko', chinese: 'zh', french: 'fr',
  german: 'de', spanish: 'es', italian: 'it', portuguese: 'pt', russian: 'ru', thai: 'th',
  indonesian: 'id', hindi: 'hi', arabic: 'ar',
};

let names: Intl.DisplayNames | null = null;
function displayNames(): Intl.DisplayNames | null {
  if (names) return names;
  try {
    names = new Intl.DisplayNames(['vi'], { type: 'language' });
  } catch {
    names = null;
  }
  return names;
}

const capitalize = (s: string) => (s ? s[0]!.toLocaleUpperCase('vi') + s.slice(1) : s);

export function languageLabel(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  const key = value.toLowerCase();
  const code = NAME_TO_CODE[key] ?? (/^[a-z]{2,3}([-_][a-z0-9]{2,4})?$/i.test(value) ? value.replace('_', '-') : null);
  if (code) {
    try {
      const label = displayNames()?.of(code);
      if (label && label.toLowerCase() !== code.toLowerCase()) return capitalize(label);
    } catch {
      /* mã không hợp lệ: rơi xuống nhánh viết hoa */
    }
  }
  return capitalize(value);
}
