'use client';

import { Pill } from '@/components/ui/Pill';
import type { DubLanguage } from '@/types/domain';

/**
 * Chọn ngôn ngữ lồng tiếng — UC17.
 *
 * Danh sách ngôn ngữ luôn đến từ bảng `voice_mappings` đang `is_active` (BR-DUB-07),
 * **không hardcode** ở frontend.
 *
 * Ngôn ngữ `available = false` vẫn được hiển thị (kèm dấu chấm cảnh báo) thay vì ẩn
 * đi: bấm vào sẽ mở panel kích hoạt lồng tiếng (UC18). Đó là cách học viên tự tạo
 * bản lồng tiếng mới.
 *
 * BR-DUB-09: ngôn ngữ trùng `sourceLanguage` của video bị vô hiệu hoá — hệ thống
 * không cho tạo job và phát trực tiếp âm thanh gốc.
 */

interface LanguageSwitcherProps {
  languages: DubLanguage[];
  activeCode: string | null;
  /** Ngôn ngữ gốc của video — không cho chọn lồng tiếng trùng (BR-DUB-09) */
  sourceLanguage: string | null;
  onSelect: (code: string) => void;
}

export function LanguageSwitcher({
  languages,
  activeCode,
  sourceLanguage,
  onSelect,
}: LanguageSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn ngôn ngữ lồng tiếng">
      {languages.map((lang) => {
        const isSource = lang.code === sourceLanguage;

        if (isSource) {
          return (
            <span
              key={lang.code}
              title="Bài giảng này vốn đã sử dụng ngôn ngữ bạn chọn"
              className="pill cursor-not-allowed opacity-50 hover:border-line hover:text-ink-muted"
            >
              <span aria-hidden>{lang.flag}</span>
              {lang.label}
              <span className="ml-1 text-[11px]">(gốc)</span>
            </span>
          );
        }

        return (
          <Pill
            key={lang.code}
            active={activeCode === lang.code}
            warnDot={!lang.available}
            onClick={() => onSelect(lang.code)}
          >
            <span aria-hidden>{lang.flag}</span>
            {lang.label}
          </Pill>
        );
      })}
    </div>
  );
}
