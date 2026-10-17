import { describe, expect, it } from 'vitest';
import { DEMO_LANGUAGES, SCENE_COUNT, nextDubLanguage, nextScene } from './demoScenes';

describe('nextScene', () => {
  it('đi lần lượt rồi quay về cảnh đầu', () => {
    expect(nextScene(0)).toBe(1);
    expect(nextScene(1)).toBe(2);
    expect(nextScene(SCENE_COUNT - 1)).toBe(0);
  });
});

describe('nextDubLanguage', () => {
  it('xoay trong các giọng lồng tiếng (bỏ qua bản gốc)', () => {
    expect(nextDubLanguage(0)).toBe(1);
    expect(nextDubLanguage(1)).toBe(2);
    expect(nextDubLanguage(4)).toBe(1);
  });
});

describe('DEMO_LANGUAGES', () => {
  it('có 5 ngôn ngữ, phần tử đầu là bản gốc', () => {
    expect(DEMO_LANGUAGES).toHaveLength(5);
    expect(DEMO_LANGUAGES[0]?.original).toBe(true);
  });
  it('mọi ngôn ngữ có tên và phụ đề', () => {
    for (const l of DEMO_LANGUAGES) {
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.subtitle.length).toBeGreaterThan(0);
    }
  });
});
