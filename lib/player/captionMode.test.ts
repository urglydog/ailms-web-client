import { describe, expect, it } from 'vitest';
import { resolveOriginalCaption } from './captionMode';

describe('resolveOriginalCaption', () => {
  it('video YouTube chưa có transcript của project → dùng phụ đề CC của YouTube', () => {
    expect(resolveOriginalCaption({ isYoutube: true, projectSubtitleCount: 0 })).toBe('youtube');
  });

  it('đã có transcript của project → luôn dùng phụ đề của project (kể cả video YouTube)', () => {
    expect(resolveOriginalCaption({ isYoutube: true, projectSubtitleCount: 12 })).toBe('project');
  });

  it('video tải lên chưa có transcript → không có phụ đề gốc nào', () => {
    expect(resolveOriginalCaption({ isYoutube: false, projectSubtitleCount: 0 })).toBe('none');
  });

  it('video tải lên có transcript → phụ đề của project', () => {
    expect(resolveOriginalCaption({ isYoutube: false, projectSubtitleCount: 3 })).toBe('project');
  });
});
