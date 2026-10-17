import { describe, expect, it } from 'vitest';
import vi from './vi.json';
import en from './en.json';
import zh from './zh.json';
import ja from './ja.json';

function keyPaths(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

const viKeys = keyPaths(vi).sort();

describe('chuỗi dịch', () => {
  it.each([
    ['en', en],
    ['zh', zh],
    ['ja', ja],
  ])('%s có đúng các khóa như vi', (_ten, messages) => {
    expect(keyPaths(messages).sort()).toEqual(viKeys);
  });

  it('có các khóa mới cho Header và trang chủ', () => {
    for (const key of [
      'header.nav.explore',
      'header.explore.allCourses',
      'header.explore.categories',
      'header.explore.more',
      'header.explore.liveNow',
      'header.account.certificates',
      'header.auth.getStarted',
      'home.hero.titleBefore',
      'home.hero.titleHighlight',
      'home.demo.step1',
      'home.demo.chatAnswer',
      'home.trending.title',
    ]) {
      expect(viKeys).toContain(key);
    }
  });

  it('không có giá trị rỗng', () => {
    for (const messages of [vi, en, zh, ja]) {
      const walk = (node: unknown): void => {
        if (typeof node === 'string') expect(node.trim().length).toBeGreaterThan(0);
        else if (node && typeof node === 'object') Object.values(node as Record<string, unknown>).forEach(walk);
      };
      walk(messages);
    }
  });
});
