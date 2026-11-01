import { describe, expect, it } from 'vitest';
import { categoryVisual } from './categoryVisual';

describe('categoryVisual', () => {
  it('trả về hình riêng cho các chủ đề đã biết', () => {
    expect(categoryVisual('lap-trinh-web', 1).icon).toBe('code');
    expect(categoryVisual('phat-trien-game', 6).icon).toBe('game');
    expect(categoryVisual('ngoai-ngu-chuyen-nganh', 5).icon).toBe('language');
  });

  it('mọi chủ đề trong dữ liệu demo đều có ảnh minh họa riêng', () => {
    const slugs = ['lap-trinh-web', 'khoa-hoc-du-lieu', 'tri-tue-nhan-tao', 'thiet-ke-ui-ux', 'ngoai-ngu-chuyen-nganh', 'phat-trien-game',
      'nen-tang-lap-trinh', 'do-hoa-dung-phim', 'lap-trinh-di-dong', 'devops-dam-may', 'an-toan-thong-tin',
      'kinh-doanh-tai-chinh', 'tin-hoc-van-phong', 'ky-nang-mem'];
    const images = slugs.map((s) => categoryVisual(s, 1).image);
    expect(images.every((i) => !!i)).toBe(true);
    expect(new Set(images).size).toBe(slugs.length);
  });

  it('chủ đề lạ vẫn có hình mặc định ổn định theo id', () => {
    const a = categoryVisual('chu-de-moi', 42);
    const b = categoryVisual('chu-de-moi', 42);
    expect(a).toEqual(b);
    expect(a.icon).toBe('folder');
    expect(a.gradient).toMatch(/^from-/);
  });

  it('chủ đề đã biết có ảnh minh họa, chủ đề lạ thì không', () => {
    expect(categoryVisual('lap-trinh-web', 1).image).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    expect(categoryVisual('chu-de-moi', 9).image).toBeNull();
  });

  it('chỉ dùng token màu của dự án, không dùng màu Tailwind thô', () => {
    for (const slug of ['lap-trinh-web', 'khoa-hoc-du-lieu', 'tri-tue-nhan-tao', 'thiet-ke-ui-ux', 'ngoai-ngu-chuyen-nganh', 'phat-trien-game', 'khac']) {
      expect(categoryVisual(slug, 3).gradient).not.toMatch(/(gray|cyan|red|blue|green|slate)-\d/);
    }
  });
});
