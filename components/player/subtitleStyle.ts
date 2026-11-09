import type { CSSProperties } from 'react';

/**
 * Cấu hình hiển thị phụ đề — giao diện tham khảo bảng Cài đặt của tiện ích eJOY (06/09/2026).
 * Áp dụng RIÊNG cho từng loại phụ đề (gốc/đã dịch), lưu vào `localStorage` — đây là tuỳ chọn
 * hiển thị của TỪNG NGƯỜI XEM (không phải nội dung bài học), nên áp dụng chung cho MỌI bài học,
 * không gắn theo `lessonId`/`courseId`.
 *
 * (06/09/2026 — sửa lần 2) Mỗi thuộc tính (màu chữ/màu nền/độ đậm nền/viền chữ) là 1 CỜ ĐỘC LẬP,
 * KHÔNG còn gộp thành các "preset" loại trừ nhau như bản đầu (default/boxed/yellow/outline/
 * minimal) — học viên yêu cầu rõ phải KẾT HỢP được (vd nền đen + chữ vàng + có viền cùng lúc).
 * `PRESET_TEMPLATES` bên dưới giờ chỉ là các nút "áp nhanh" 1 PHẦN cấu hình (patch), không phải
 * lựa chọn loại trừ — bấm nhiều mẫu liên tiếp sẽ CHỒNG lên nhau đúng như học viên mô tả.
 */

export type SubtitleFontSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface SubtitlePosition {
  /** % chiều rộng khung video, tính tới TÂM khối phụ đề (0-100). */
  xPercent: number;
  /** % chiều cao khung video, tính tới TÂM khối phụ đề (0-100). */
  yPercent: number;
}

export interface SubtitleTypeSettings {
  fontSize: SubtitleFontSize;
  /** Mã màu hex, ví dụ `#ffffff`. */
  textColor: string;
  /** Mã màu hex của NỀN phía sau chữ — luôn có giá trị, độ đậm thật sự do `backgroundOpacity`
   * quyết định (0 = trong suốt hoàn toàn, coi như không có nền). */
  backgroundColor: string;
  /** 0-100 — 0 = nền trong suốt hoàn toàn, 100 = nền đặc kín. */
  backgroundOpacity: number;
  /** Viền/bóng đen quanh chữ (kiểu phụ đề TV cổ điển) — bật/tắt độc lập, kết hợp được với mọi
   * màu chữ/màu nền/độ đậm khác. */
  outline: boolean;
  position: SubtitlePosition;
}

export interface SubtitleSettings {
  original: SubtitleTypeSettings;
  translated: SubtitleTypeSettings;
}

export const FONT_SIZE_OPTIONS: { value: SubtitleFontSize; label: string; textClass: string }[] = [
  { value: 'sm', label: 'Aa', textClass: 'text-xs' },
  { value: 'md', label: 'Aa', textClass: 'text-sm' },
  { value: 'lg', label: 'Aa', textClass: 'text-base' },
  { value: 'xl', label: 'Aa', textClass: 'text-lg' },
  { value: 'xxl', label: 'Aa', textClass: 'text-2xl' },
];

/** Bảng màu nhanh — màu phụ đề phổ biến, cho cả chữ lẫn nền. Học viên vẫn tự nhập mã hex riêng
 * hoặc dùng bảng chọn màu gốc của trình duyệt (`<input type="color">`) nếu cần màu khác. */
export const COLOR_SWATCHES = ['#ffffff', '#fde047', '#000000', '#22d3ee', '#4ade80', '#f87171', '#a78bfa', '#38bdf8'];

/** Mẫu áp nhanh 1 PHẦN cấu hình (patch) — KHÔNG loại trừ nhau, bấm nhiều mẫu liên tiếp sẽ chồng
 * lên nhau (vd "Nền đen" rồi "Chữ vàng" rồi "Viền chữ" -> nền đen + chữ vàng + có viền). */
export const PRESET_TEMPLATES: { label: string; patch: Partial<SubtitleTypeSettings> }[] = [
  { label: 'Mặc định', patch: { textColor: '#ffffff', backgroundColor: '#0b0b0f', backgroundOpacity: 80, outline: false } },
  { label: 'Nền đen', patch: { backgroundColor: '#000000', backgroundOpacity: 90 } },
  { label: 'Chữ vàng', patch: { textColor: '#fde047' } },
  { label: 'Viền chữ', patch: { outline: true } },
  { label: 'Tối giản (không nền)', patch: { backgroundOpacity: 0, outline: true } },
];

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  translated: {
    fontSize: 'lg', textColor: '#ffffff', backgroundColor: '#0b0b0f', backgroundOpacity: 80, outline: false,
    position: { xPercent: 50, yPercent: 84 },
  },
  original: {
    fontSize: 'md', textColor: '#ffffff', backgroundColor: '#0b0b0f', backgroundOpacity: 60, outline: false,
    position: { xPercent: 50, yPercent: 92 },
  },
};

const STORAGE_KEY = 'lms:subtitleSettings';

export function isValidHexColor(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/** Chuẩn hoá về đúng 1 dạng lưu trữ: `#rrggbb` chữ thường (kể cả nhập tắt `#fff` hay thiếu `#`
 * đầu) — `<input type="color">` của trình duyệt CHỈ chấp nhận đúng dạng 6 ký tự này. Trả về
 * `null` nếu chuỗi nhập không phải mã màu hợp lệ. */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (!isValidHexColor(trimmed)) return null;
  const clean = trimmed.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return `#${full.toLowerCase()}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex) ?? '#000000';
  const value = parseInt(normalized.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function loadSubtitleSettings(): SubtitleSettings {
  if (typeof window === 'undefined') return DEFAULT_SUBTITLE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SUBTITLE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SubtitleSettings>;
    return {
      original: { ...DEFAULT_SUBTITLE_SETTINGS.original, ...parsed.original },
      translated: { ...DEFAULT_SUBTITLE_SETTINGS.translated, ...parsed.translated },
    };
  } catch {
    return DEFAULT_SUBTITLE_SETTINGS;
  }
}

export function saveSubtitleSettings(settings: SubtitleSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Trình duyệt chặn localStorage (vd chế độ ẩn danh khắt khe) — bỏ qua, không phải chức năng cốt lõi.
  }
}

/** Dựng className + style inline cho 1 khối phụ đề theo cấu hình đang chọn — dùng CHUNG cho cả
 * overlay thật trên video (`DualPlayer.tsx`), khung xem trước (`SubtitleSettingsModal.tsx`) lẫn
 * 2 khối kéo-thả lúc chỉnh vị trí (`SubtitlePositionEditor.tsx`), để "xem trước" luôn khớp y hệt
 * hiển thị thật. Mọi thuộc tính ĐỘC LẬP và LUÔN được áp cùng lúc (không phải chọn 1-trong-N như
 * bản preset cũ) — đây là điểm mấu chốt để các lựa chọn kết hợp được với nhau. */
export function buildSubtitleAppearance(settings: SubtitleTypeSettings): { className: string; style: CSSProperties } {
  const sizeClass = FONT_SIZE_OPTIONS.find((f) => f.value === settings.fontSize)?.textClass ?? 'text-base';
  const alpha = Math.min(1, Math.max(0, settings.backgroundOpacity / 100));
  const textColor = normalizeHex(settings.textColor) ?? '#ffffff';

  const outlineShadow = '0 0 3px #000, 0 0 6px #000, 1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000';
  const noBackgroundShadow = '0 1px 3px rgba(0,0,0,0.9)';

  const style: CSSProperties = {
    color: textColor,
    backgroundColor: alpha > 0 ? hexToRgba(settings.backgroundColor, alpha) : 'transparent',
    // Nền trong suốt (alpha=0) mà không bật viền chữ thì vẫn thêm 1 bóng nhẹ để chữ không bị
    // "chìm" vào video sáng màu — không thay thế cho viền chữ CHỦ ĐỘNG bật (outlineShadow đậm hơn).
    textShadow: settings.outline ? outlineShadow : alpha === 0 ? noBackgroundShadow : undefined,
  };

  return {
    className: `${sizeClass} rounded-md px-3 py-1.5 font-semibold shadow-lg`,
    style,
  };
}
