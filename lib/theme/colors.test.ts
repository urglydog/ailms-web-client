import { describe, expect, it } from 'vitest';
import config from '@/tailwind.config';
import { contrastRatio } from '@/lib/a11y/contrast';
import { COLORS } from './colors';

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
  ['chữ trắng trên danger (huy hiệu đếm)', COLORS.white, COLORS.danger],
];

describe('bảng màu', () => {
  it.each(PAIRS)('%s đạt tương phản AA', (_ten, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it('tailwind.config dùng đúng giá trị từ COLORS', () => {
    const colors = config.theme?.extend?.colors as unknown as Record<string, Record<string, string> | string>;
    const accent = colors.accent as Record<string, string>;
    const ink = colors.ink as Record<string, string>;
    expect(accent.DEFAULT).toBe(COLORS.accent);
    expect(accent.dark).toBe(COLORS.accentDark);
    expect(ink.DEFAULT).toBe(COLORS.ink);
    expect(colors.tint).toBe(COLORS.tint);
  });
});
