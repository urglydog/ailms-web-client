import { describe, expect, it } from 'vitest';
import { COLORS, DARK_COLORS } from './colors';
import { designTokens } from './designTokens';

type Leaf = { $type: string; $value: unknown };
const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((a, k) => (a as Record<string, unknown>)[k], o) as Leaf;

describe('designTokens (DTCG)', () => {
  it('màu sáng/tối lấy đúng từ colors.ts', () => {
    const t = designTokens();
    expect(get(t, 'color.light.accent').$value).toBe(COLORS.accent);
    expect(get(t, 'color.dark.accent').$value).toBe(DARK_COLORS.accent);
    expect(get(t, 'color.dark.textAccent').$type).toBe('color');
  });
  it('token chuyển động khớp biến CSS', () => {
    const t = designTokens();
    expect(get(t, 'motion.durBase').$value).toBe('200ms');
    expect(get(t, 'motion.easeOut').$value).toEqual([0.2, 0.8, 0.2, 1]);
  });
  it('mỗi lá đều có $type và $value', () => {
    const walk = (o: Record<string, unknown>): void =>
      Object.values(o).forEach((v) => {
        const r = v as Record<string, unknown>;
        if ('$value' in r) expect(typeof r.$type).toBe('string');
        else walk(r);
      });
    walk(designTokens());
  });
});
