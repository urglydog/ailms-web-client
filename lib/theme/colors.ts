/**
 * Nguồn sự thật duy nhất cho màu giao diện học viên (spec mục 3.1).
 * `tailwind.config.ts` đọc qua biến CSS sinh từ đây (`lib/theme/cssVars.ts`); mã TypeScript cần
 * màu thật (themeColor, chứng chỉ) cũng import từ đây — không ghi cứng mã hex ở nơi khác.
 */
export const COLORS = {
  white: '#FFFFFF',
  accent: '#1D62D6',
  accentDark: '#1853B6',
  ink: '#0E1A2B',
  inkMuted: '#4B5869',
  inkFaint: '#667286',
  line: '#DCE2EA',
  lineSoft: '#EDF1F6',
  lineDot: '#C5CEDA',
  surface: '#F6F8FB',
  surfaceRaised: '#FFFFFF',
  tint: '#EAF1FC',
  cyan: '#22D3EE',
  cyanInk: '#032B33',
  highlight: '#FFD84A',
  success: '#12753F',
  successInk: '#0F6B3D',
  successTint: '#E3F4EA',
  warning: '#D97706',
  star: '#F59E0B',
  danger: '#C0302A',
  streakBg: '#FFF1D6',
  streakInk: '#8A4B00',
} as const;

export type ColorToken = keyof typeof COLORS;

/**
 * Bảng màu chế độ tối — cùng bộ token với {@link COLORS} để mọi lớp Tailwind (`bg-surface`,
 * `text-ink`…) tự đổi theo. 21/11/2026 (UI v2): nền trung tính hơi ngả xanh, không dùng đen tuyền;
 * nút accent riêng cho tối (#2F64D0, sáng hơn bản light) để chữ trắng vẫn đạt AA mà không bị chìm. Màu NỀN nút success, danger giữ độ đậm để
 * chữ trắng trên nút vẫn đạt AA; khi các màu này dùng làm CHỮ trên nền tối thì lấy bản sáng ở
 * {@link DARK_TEXT}.
 */
export const DARK_COLORS: Record<ColorToken, string> = {
  white: '#FFFFFF',
  accent: '#2F64D0',
  accentDark: '#3A70DE',
  ink: '#E7ECF3',
  inkMuted: '#A6B1C1',
  inkFaint: '#8592A5',
  line: '#283444',
  lineSoft: '#18212D',
  lineDot: '#36445A',
  surface: '#0C121B',
  surfaceRaised: '#131B26',
  tint: '#1A2432',
  cyan: '#22D3EE',
  cyanInk: '#032B33',
  highlight: '#FFD84A',
  success: '#13804A',
  successInk: '#5FD08F',
  successTint: '#10301F',
  warning: '#D97706',
  star: '#F59E0B',
  danger: '#DC2626',
  streakBg: '#3A2A0C',
  streakInk: '#FFC66B',
};

/** Màu CHỮ ở chế độ tối cho các token vốn là màu nền nút (accent, success, danger, warning). */
export const DARK_TEXT = {
  accent: '#8AB5FF',
  accentDark: '#A9C8FF',
  success: '#5FD38F',
  danger: '#FF8A8A',
  warning: '#FBBF24',
} as const;

/** Màu "đêm" cố định cho nền tối luôn tối (lớp phủ `bg-ink/50`, chữ trên nền vàng) ở cả hai chế độ. */
export const NIGHT = COLORS.ink;
