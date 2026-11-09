import { COLORS, DARK_COLORS, DARK_TEXT, NIGHT, type ColorToken } from './colors';

/** "#1A6FE0" → "26 111 224" — dạng kênh RGB để Tailwind ghép độ trong suốt (`bg-accent/40`). */
export function hexToRgbChannels(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m || !m[1]) throw new Error(`Màu hex không hợp lệ: ${hex}`);
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Tên biến CSS của một token: accentDark → --c-accent-dark. */
export const cssVarName = (token: string) => `--c-${token.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`;

/** Giá trị màu Tailwind trỏ tới biến CSS, giữ được modifier độ mờ. */
export const tw = (token: ColorToken | 'night') => `rgb(var(${cssVarName(token)}) / <alpha-value>)`;

const block = (palette: Record<string, string>, prefix = '') =>
  Object.entries(palette)
    .map(([k, v]) => `${cssVarName(prefix + k)}:${hexToRgbChannels(v)};`)
    .join('');

/**
 * CSS nạp ở <head>: biến màu cho chế độ sáng (`:root`) và tối (`.dark`). Biến `--c-text-*` là màu
 * chữ riêng của chế độ tối (xem DARK_TEXT); `--c-night` là màu tối cố định cho lớp phủ.
 */
export function themeCss(): string {
  const darkText = Object.fromEntries(
    Object.entries(DARK_TEXT).map(([k, v]) => [`text${k[0]!.toUpperCase()}${k.slice(1)}`, v]),
  );
  return (
    `:root{${block(COLORS)}${cssVarName('night')}:${hexToRgbChannels(NIGHT)};color-scheme:light;}` +
    `.dark{${block(DARK_COLORS)}${block(darkText)}color-scheme:dark;}`
  );
}
