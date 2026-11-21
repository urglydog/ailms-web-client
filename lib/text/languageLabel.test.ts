import { describe, expect, it } from 'vitest';
import { languageLabel } from './languageLabel';

describe('languageLabel', () => {
  it('đổi tên tiếng Anh viết thường sang tiếng Việt', () => {
    expect(languageLabel('english')).toBe('Tiếng Anh');
  });
  it('đổi mã ngôn ngữ', () => {
    expect(languageLabel('ko')).toBe('Tiếng Hàn');
  });
  it('giữ nguyên tên đã đầy đủ', () => {
    expect(languageLabel('Tiếng Việt (Việt Nam)')).toBe('Tiếng Việt (Việt Nam)');
  });
  it('viết hoa chữ đầu khi không nhận ra', () => {
    expect(languageLabel('klingon')).toBe('Klingon');
  });
  it('rỗng trả rỗng', () => {
    expect(languageLabel(undefined)).toBe('');
  });
});
