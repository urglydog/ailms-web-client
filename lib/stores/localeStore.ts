import { create } from 'zustand';

/** Ngôn ngữ giao diện thật (26/09/2026, tính năng mới) — thay thế lựa chọn cosmetic cũ trong
 * `LanguageModal.tsx` (chỉ lưu localStorage, KHÔNG đổi chữ trên trang). 4 ngôn ngữ theo đúng
 * phạm vi đã thống nhất: Việt/Anh/Trung/Nhật — không thêm ngôn ngữ khác vì không ai kiểm tra
 * được chất lượng dịch của các thứ tiếng còn lại.
 *
 * Khác `preferredLanguage` của `User` (ngôn ngữ LỒNG TIẾNG mặc định — khái niệm nghiệp vụ khác,
 * xem `User.java` và docblock cũ ở `LanguageModal.tsx`).
 */
export const LOCALES = ['vi', 'en', 'zh', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';

/** Tên hiển thị của mỗi ngôn ngữ LUÔN ở chính ngôn ngữ đó (không dịch tên ngôn ngữ khác sang
 * ngôn ngữ đang hiển thị) — dùng chung cho `LanguageModal` và dòng "Ngôn ngữ" trong menu tài
 * khoản ở `Header.tsx`. */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

const STORAGE_KEY = 'ui_locale';

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Đọc lựa chọn đã lưu từ lần trước — gọi 1 lần trong `useEffect` của `LocaleProvider` (KHÔNG
   * đọc ngay lúc khởi tạo store) để tránh lệch nội dung giữa lần render đầu trên server (luôn
   * `vi`) và trên trình duyệt — cùng khuôn với `getStoredUiLanguage()` cũ. */
  hydrateFromStorage: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
    set({ locale });
  },
  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) set({ locale: stored });
  },
}));
