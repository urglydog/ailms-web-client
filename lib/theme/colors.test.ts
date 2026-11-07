import { describe, expect, it } from 'vitest';
import config from '@/tailwind.config';
import { contrastRatio } from '@/lib/a11y/contrast';
import { COLORS, DARK_COLORS, DARK_TEXT, NIGHT } from './colors';
import { cssVarName, hexToRgbChannels, themeCss } from './cssVars';

const AA = 4.5;

const PAIRS: Array<[string, string, string]> = [
  ['chữ trắng trên accent (nút chính)', COLORS.white, COLORS.accent],
  ['chữ trắng trên accent-dark (hover nút chính)', COLORS.white, COLORS.accentDark],
  ['ink trên trắng', COLORS.ink, COLORS.surfaceRaised],
  ['ink trên surface', COLORS.ink, COLORS.surface],
  ['ink-muted trên trắng', COLORS.inkMuted, COLORS.surfaceRaised],
  ['ink-muted trên surface', COLORS.inkMuted, COLORS.surface],
  ['ink-muted trên tint', COLORS.inkMuted, COLORS.tint],
  ['accent làm liên kết trên trắng', COLORS.accent, COLORS.surfaceRaised],
  ['accent làm liên kết trên surface', COLORS.accent, COLORS.surface],
  ['accent-dark làm chữ trên tint (tab đang chọn, chip)', COLORS.accentDark, COLORS.tint],
  ['accent-dark làm chữ trên surface', COLORS.accentDark, COLORS.surface],
  ['chữ trắng trên success (nút/thanh hoàn thành)', COLORS.white, COLORS.success],
  ['success-ink trên success-tint (nút Xem chứng chỉ)', COLORS.successInk, COLORS.successTint],
  ['success-ink trên trắng', COLORS.successInk, COLORS.surfaceRaised],
  ['cyan-ink trên cyan (nút ngôn ngữ)', COLORS.cyanInk, COLORS.cyan],
  ['ink trên highlight (mảng tô vàng)', COLORS.ink, COLORS.highlight],
  ['streak-ink trên streak-bg', COLORS.streakInk, COLORS.streakBg],
  ['chữ trắng trên danger (huy hiệu đếm, nhãn đang live)', COLORS.white, COLORS.danger],
  ['danger làm chữ trên trắng (lỗi, nút xóa)', COLORS.danger, COLORS.surfaceRaised],
  ['danger làm chữ trên surface', COLORS.danger, COLORS.surface],
  ['ink-muted trên line-soft (nhãn đã lưu trữ)', COLORS.inkMuted, COLORS.lineSoft],
  ['ink-faint trên trắng', COLORS.inkFaint, COLORS.surfaceRaised],
  ['ink trên warning (ô hạng 3 trên bục)', COLORS.ink, COLORS.warning],
];

const D = DARK_COLORS;
const DARK_PAIRS: Array<[string, string, string]> = [
  ['chữ trắng trên accent (nút chính)', D.white, D.accent],
  ['chữ trắng trên accent-dark (hover nút chính)', D.white, D.accentDark],
  ['ink trên surface-raised', D.ink, D.surfaceRaised],
  ['ink trên surface', D.ink, D.surface],
  ['ink trên tint', D.ink, D.tint],
  ['ink-muted trên surface-raised', D.inkMuted, D.surfaceRaised],
  ['ink-muted trên surface', D.inkMuted, D.surface],
  ['ink-muted trên tint', D.inkMuted, D.tint],
  ['ink-muted trên line-soft', D.inkMuted, D.lineSoft],
  ['ink-faint trên surface-raised', D.inkFaint, D.surfaceRaised],
  ['chữ accent trên surface', DARK_TEXT.accent, D.surface],
  ['chữ accent trên surface-raised', DARK_TEXT.accent, D.surfaceRaised],
  ['chữ accent-dark trên tint (tab đang chọn, chip)', DARK_TEXT.accentDark, D.tint],
  ['chữ success trên surface-raised', DARK_TEXT.success, D.surfaceRaised],
  ['chữ danger trên surface-raised', DARK_TEXT.danger, D.surfaceRaised],
  ['chữ warning trên surface-raised', DARK_TEXT.warning, D.surfaceRaised],
  ['chữ trắng trên success', D.white, D.success],
  ['chữ trắng trên danger', D.white, D.danger],
  ['success-ink trên success-tint', D.successInk, D.successTint],
  ['streak-ink trên streak-bg', D.streakInk, D.streakBg],
  ['cyan-ink trên cyan', D.cyanInk, D.cyan],
  ['chữ tối cố định trên highlight', NIGHT, D.highlight],
  ['chữ tối cố định trên warning', NIGHT, D.warning],
];

describe('bảng màu', () => {
  it.each(PAIRS)('sáng: %s đạt tương phản AA', (_ten, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it.each(DARK_PAIRS)('tối: %s đạt tương phản AA', (_ten, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it('bảng màu tối có đủ mọi token của bảng sáng', () => {
    expect(Object.keys(DARK_COLORS).sort()).toEqual(Object.keys(COLORS).sort());
  });

  it('tailwind.config trỏ màu vào biến CSS để đổi theme', () => {
    const colors = config.theme?.extend?.colors as unknown as Record<string, Record<string, string> | string>;
    expect((colors.accent as Record<string, string>).DEFAULT).toBe('rgb(var(--c-accent) / <alpha-value>)');
    expect((colors.ink as Record<string, string>).DEFAULT).toBe('rgb(var(--c-ink) / <alpha-value>)');
    expect(colors.tint).toBe('rgb(var(--c-tint) / <alpha-value>)');
  });

  it('themeCss sinh biến cho cả hai chế độ từ đúng bảng màu', () => {
    const css = themeCss();
    expect(css).toContain(`:root{${cssVarName('white')}:255 255 255;`);
    expect(css).toContain(`${cssVarName('ink')}:${hexToRgbChannels(COLORS.ink)};`);
    expect(css).toContain(`.dark{${cssVarName('white')}:255 255 255;`);
    expect(css).toContain(`--c-text-accent:${hexToRgbChannels(DARK_TEXT.accent)};`);
    expect(cssVarName('accentDark')).toBe('--c-accent-dark');
  });
});
