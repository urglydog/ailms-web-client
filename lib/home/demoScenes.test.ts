import { describe, expect, it } from 'vitest';
import {
  DEMO_JUMP_SECONDS,
  DEMO_LANGUAGES,
  DEMO_PICKS,
  DEMO_START_SECONDS,
  DEMO_TOTAL_SECONDS,
} from './demoScenes';

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

describe('DEMO_PICKS', () => {
  it('lần chọn đầu đi từ bản gốc, mỗi lần chọn bắt đầu từ lựa chọn trước đó', () => {
    expect(DEMO_PICKS[0]?.[1]).toBe(0);
    DEMO_PICKS.forEach(([pick], i) => {
      if (i > 0) expect(DEMO_PICKS[i]?.[1]).toBe(DEMO_PICKS[i - 1]?.[0]);
      expect(pick).toBeGreaterThan(0);
      expect(pick).toBeLessThan(DEMO_LANGUAGES.length);
    });
  });
  it('kết thúc ở Tiếng Việt, ngôn ngữ của câu hỏi gia sư', () => {
    const last = DEMO_PICKS[DEMO_PICKS.length - 1];
    expect(DEMO_LANGUAGES[last?.[0] ?? 0]?.code).toBe('vi');
  });
});

describe('mốc thời gian của video demo', () => {
  it('điểm tua nằm sau điểm bắt đầu và trong thời lượng video', () => {
    expect(DEMO_JUMP_SECONDS).toBeGreaterThan(DEMO_START_SECONDS);
    expect(DEMO_JUMP_SECONDS).toBeLessThan(DEMO_TOTAL_SECONDS);
  });
});
