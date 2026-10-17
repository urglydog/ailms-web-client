import { describe, expect, it } from 'vitest';
import { resolveCategoryParam } from './categoryParam';

const CATS = [{ slug: 'lap-trinh' }, { slug: 'ngoai-ngu' }];

describe('resolveCategoryParam', () => {
  it('trả về slug khi hợp lệ', () => {
    expect(resolveCategoryParam('lap-trinh', CATS)).toBe('lap-trinh');
  });
  it('null khi không có tham số', () => {
    expect(resolveCategoryParam(null, CATS)).toBeNull();
    expect(resolveCategoryParam('', CATS)).toBeNull();
  });
  it('null khi slug không tồn tại, không tin dữ liệu từ URL', () => {
    expect(resolveCategoryParam('khong-co', CATS)).toBeNull();
  });
  it('null khi chưa tải xong danh mục', () => {
    expect(resolveCategoryParam('lap-trinh', [])).toBeNull();
  });
});
