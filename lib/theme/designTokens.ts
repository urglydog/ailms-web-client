import { COLORS, DARK_COLORS, DARK_TEXT } from './colors';

/**
 * Bộ token thiết kế dạng W3C Design Tokens (DTCG) — nguồn chung cho web và app mobile `ailms-mobile`
 * (UI v2, doc/feat/uiux/DESIGN.md). Sinh từ `colors.ts` nên web và mobile luôn cùng giá trị.
 * Xuất ra file: `node scripts/export-design-tokens.mjs`.
 */
type Token = { $type: string; $value: string | number | number[] };
type Group = { [key: string]: Token | Group };

const color = (palette: Record<string, string>): Group =>
  Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, { $type: 'color', $value: v }]));

const dim = (px: number): Token => ({ $type: 'dimension', $value: `${px}px` });
const dur = (ms: number): Token => ({ $type: 'duration', $value: `${ms}ms` });
const ease = (v: number[]): Token => ({ $type: 'cubicBezier', $value: v });

export function designTokens(): Group {
  const darkText = Object.fromEntries(Object.entries(DARK_TEXT).map(([k, v]) => [`text${k[0]!.toUpperCase()}${k.slice(1)}`, v]));
  return {
    color: {
      light: color(COLORS),
      dark: color({ ...DARK_COLORS, ...darkText }),
    },
    radius: { chip: dim(6), control: dim(8), card: dim(12), sheet: dim(16) },
    spacing: Object.fromEntries([4, 8, 12, 16, 24, 32, 48].map((n) => [String(n), dim(n)])),
    fontSize: Object.fromEntries([12, 14, 16, 18, 20, 24, 30, 36].map((n) => [String(n), dim(n)])),
    fontFamily: {
      display: { $type: 'fontFamily', $value: 'Outfit' },
      body: { $type: 'fontFamily', $value: 'Plus Jakarta Sans' },
      mono: { $type: 'fontFamily', $value: 'IBM Plex Mono' },
    },
    motion: {
      durFast: dur(120),
      durBase: dur(200),
      durSlow: dur(320),
      easeOut: ease([0.2, 0.8, 0.2, 1]),
      easeIn: ease([0.4, 0, 1, 1]),
    },
    size: { touchTarget: dim(44), pageGutterMobile: dim(16) },
  };
}
