/**
 * Nguồn sự thật duy nhất cho màu giao diện học viên (spec mục 3.1).
 * `tailwind.config.ts` đọc qua biến CSS sinh từ đây (`lib/theme/cssVars.ts`); mã TypeScript cần
 * màu thật (themeColor, chứng chỉ) cũng import từ đây — không ghi cứng mã hex ở nơi khác.
 */
export const COLORS = {
  white: '#FFFFFF',
  accent: '#1A6FE0',
  accentDark: '#155FC4',
  ink: '#0A2540',
  inkMuted: '#4B6784',
  inkFaint: '#64748B',
  line: '#CFE3FB',
  lineSoft: '#E2ECF8',
  lineDot: '#94A3B8',
  surface: '#F3F9FF',
  surfaceRaised: '#FFFFFF',
  tint: '#E8F2FF',
  cyan: '#22D3EE',
  cyanInk: '#032B33',
  highlight: '#FFD84A',
  success: '#13804A',
  successInk: '#0F6B3D',
  successTint: '#E3F6EA',
  warning: '#D97706',
  star: '#F59E0B',
  danger: '#DC2626',
  streakBg: '#FFF1D6',
  streakInk: '#8A4B00',
} as const;

export type ColorToken = keyof typeof COLORS;

/**
 * Bảng màu chế độ tối — cùng bộ token với {@link COLORS} để mọi lớp Tailwind (`bg-surface`,
 * `text-ink`…) tự đổi theo. Nền xanh navy đậm cùng họ với màu thương hiệu (không dùng đen tuyền,
 * đỡ chói và giữ chất "học thuật"). Màu NỀN của nút (accent, success, danger) giữ nguyên độ đậm để
 * chữ trắng trên nút vẫn đạt AA; khi các màu này dùng làm CHỮ trên nền tối thì lấy bản sáng ở
 * {@link DARK_TEXT}.
 */
export const DARK_COLORS: Record<ColorToken, string> = {
  white: '#FFFFFF',
  accent: '#1A6FE0',
  accentDark: '#155FC4',
  ink: '#E6EEF8',
  inkMuted: '#A9BCD3',
  inkFaint: '#8FA3BA',
  line: '#2A4566',
  lineSoft: '#1D3551',
  lineDot: '#5B7594',
  surface: '#0B1623',
  surfaceRaised: '#122236',
  tint: '#18304B',
  cyan: '#22D3EE',
  cyanInk: '#032B33',
  highlight: '#FFD84A',
  success: '#13804A',
  successInk: '#7FE0A8',
  successTint: '#12321F',
  warning: '#D97706',
  star: '#F59E0B',
  danger: '#DC2626',
  streakBg: '#3A2A0C',
  streakInk: '#FFC66B',
};

/** Màu CHỮ ở chế độ tối cho các token vốn là màu nền nút (accent, success, danger, warning). */
export const DARK_TEXT = {
  accent: '#7CB3FF',
  accentDark: '#9CC5FF',
  success: '#5FD38F',
  danger: '#FF8A8A',
  warning: '#FBBF24',
} as const;

/** Màu "đêm" cố định cho nền tối luôn tối (lớp phủ `bg-ink/50`, chữ trên nền vàng) ở cả hai chế độ. */
export const NIGHT = COLORS.ink;
