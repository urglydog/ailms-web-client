'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Chọn ngôn ngữ giao diện (14/09/2026, mở rộng ngoài đặc tả gốc) — theo đúng yêu cầu: CHỈ hiện
 * danh sách giống Udemy, CHƯA có logic đổi ngôn ngữ UI thật (dự án chưa có i18n). Lựa chọn chỉ
 * lưu cosmetic vào `localStorage` để nút "Ngôn ngữ" ở dropdown tài khoản nhớ hiển thị đúng lần
 * chọn gần nhất — KHÔNG ảnh hưởng ngôn ngữ thật của bất kỳ trang nào trong site.
 *
 * Khác `preferredLanguage` của `User` (đó là ngôn ngữ LỒNG TIẾNG mặc định, một khái niệm nghiệp
 * vụ hoàn toàn khác — xem `User.java` — cố tình KHÔNG dùng chung field để tránh nhầm 2 khái niệm).
 */
export const UI_LANGUAGES = [
  'English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Română', '中文(繁體)',
  'العربية', '日本語', 'Русский', '한국어', 'ภาษาไทย', 'Nederlands', 'Türkçe',
  'Polski', 'Português', 'Bahasa Indonesia', 'Tiếng Việt', '中文(简体)',
] as const;

const STORAGE_KEY = 'ui_language_cosmetic';

export function getStoredUiLanguage(): string {
  if (typeof window === 'undefined') return 'Tiếng Việt';
  return localStorage.getItem(STORAGE_KEY) || 'Tiếng Việt';
}

export function LanguageModal({
  currentLanguage,
  onClose,
  onSelect,
}: {
  currentLanguage: string;
  onClose: () => void;
  onSelect: (language: string) => void;
}) {
  const [search, setSearch] = useState('');
  // (14/09/2026, sửa lỗi) — "Tiếng Việt" đã nằm sẵn trong UI_LANGUAGES, nối thêm 1 lần nữa ở
  // đầu mảng làm nó xuất hiện 2 lần trong danh sách. Dùng thẳng UI_LANGUAGES, không nối gì thêm.
  const filtered = UI_LANGUAGES.filter((l) => l.toLowerCase().includes(search.toLowerCase()));

  const handlePick = (language: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, language);
    onSelect(language);
    toast.info('Ngôn ngữ hiển thị sẽ được hỗ trợ đầy đủ trong bản cập nhật tới — hiện tại nội dung site vẫn giữ tiếng Việt.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Chọn ngôn ngữ</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-xl text-ink-faint hover:text-ink">
            ×
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm ngôn ngữ..."
          className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {filtered.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => handlePick(language)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                language === currentLanguage
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-ink hover:bg-surface'
              }`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
