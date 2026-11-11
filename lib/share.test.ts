import { describe, expect, it } from 'vitest';
import { buildShareUrl, channelHref } from './share';

describe('buildShareUrl', () => {
  it('link công khai không có tham số khi không có ref/kênh', () => {
    expect(buildShareUrl('https://app.example', 'unity-co-ban')).toBe('https://app.example/courses/unity-co-ban');
  });
  it('gắn ref và kênh, bỏ dấu / thừa ở cuối origin', () => {
    expect(buildShareUrl('https://app.example/', 'unity', { ref: 'ae6686acb5', channel: 'facebook' })).toBe(
      'https://app.example/courses/unity?ref=ae6686acb5&src=facebook',
    );
  });
  it('mã hóa slug và giá trị đặc biệt', () => {
    expect(buildShareUrl('https://a.b', 'a b', { ref: 'x&y' })).toBe('https://a.b/courses/a%20b?ref=x%26y');
  });
  it('ref rỗng/null bị bỏ qua', () => {
    expect(buildShareUrl('https://a.b', 's', { ref: '', channel: 'x' })).toBe('https://a.b/courses/s?src=x');
    expect(buildShareUrl('https://a.b', 's', { ref: null })).toBe('https://a.b/courses/s');
  });
});

describe('channelHref', () => {
  const url = 'https://a.b/courses/s?ref=r&src=x';
  it('mã hóa URL và tiêu đề cho từng mạng', () => {
    expect(channelHref('facebook', url, 'Khóa A')).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    expect(channelHref('x', url, 'Khóa A')).toContain('twitter.com/intent/tweet?url=');
    expect(channelHref('linkedin', url, 'Khóa A')).toContain('linkedin.com/sharing/share-offsite/?url=');
    expect(channelHref('telegram', url, 'Khóa A')).toContain('t.me/share/url?url=');
  });
  it('email dùng mailto với tiêu đề và nội dung đã mã hóa', () => {
    const href = channelHref('email', url, 'Khóa A');
    expect(href.startsWith('mailto:?subject=')).toBe(true);
    expect(href).toContain(encodeURIComponent('Khóa A'));
  });
});
