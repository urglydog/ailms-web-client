'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { LOCALE_NATIVE_NAMES, LOCALES, useLocaleStore, type Locale } from '@/lib/stores/localeStore';

/**
 * Chọn ngôn ngữ giao diện (26/09/2026, thay thế placeholder cosmetic cũ) — giờ đổi chữ thật trên
 * toàn Header/Footer thông qua `next-intl` (`LocaleProvider`), không còn chỉ lưu localStorage rồi
 * không làm gì. Rút từ 19 ngôn ngữ (bắt chước danh sách Udemy) xuống còn 4: Việt/Anh/Trung/Nhật —
 * theo đúng phạm vi đã thống nhất, vì không ai trong nhóm kiểm chứng được bản dịch của các thứ
 * tiếng còn lại có đúng nghĩa hay không. Danh sách chỉ còn 4 mục nên bỏ luôn ô tìm kiếm cũ.
 *
 * Tên hiển thị của MỖI ngôn ngữ luôn ở CHÍNH ngôn ngữ đó ("English", "中文", "日本語", "Tiếng
 * Việt") bất kể đang chọn ngôn ngữ nào — đúng quy ước phổ biến của các bộ chọn ngôn ngữ thật
 * (Google, Udemy...), không dịch tên các ngôn ngữ khác sang ngôn ngữ đang hiển thị — xem
 * `LOCALE_NATIVE_NAMES` (dùng chung với dòng "Ngôn ngữ" trong menu tài khoản ở `Header.tsx`).
 *
 * Khác `preferredLanguage` của `User` (đó là ngôn ngữ LỒNG TIẾNG mặc định, một khái niệm nghiệp
 * vụ hoàn toàn khác — xem `User.java` — cố tình KHÔNG dùng chung field để tránh nhầm 2 khái niệm).
 */
export function LanguageModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('languageModal');
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const handlePick = (picked: Locale) => {
    setLocale(picked);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={t('title')} closeLabel={t('close')} size="sm">
        <div className="grid grid-cols-2 gap-1.5">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handlePick(l)}
              className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                l === locale ? 'bg-accent/10 font-semibold text-accent-dark' : 'text-ink hover:bg-tint'
              }`}
            >
              {LOCALE_NATIVE_NAMES[l]}
            </button>
          ))}
        </div>
    </Modal>
  );
}
