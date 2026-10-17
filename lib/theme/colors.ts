/**
 * Nguồn sự thật duy nhất cho màu giao diện học viên (spec mục 3.1).
 * `tailwind.config.ts` đọc từ đây; mã TypeScript cần màu thật (themeColor, chứng chỉ)
 * cũng import từ đây — không ghi cứng mã hex ở nơi khác.
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
