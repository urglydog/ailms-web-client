import { describe, expect, it } from 'vitest';
import { detectOutlineLang, lessonLabel, sectionLabel } from './outlineLabel';

describe('outlineLabel', () => {
  it('khóa tiếng Anh dùng Section/Lesson, khóa tiếng Việt dùng Phần/Bài', () => {
    expect(sectionLabel('en', 2, 'Components')).toBe('Section 2: Components');
    expect(lessonLabel('en', 5, 'Interpolation')).toBe('Lesson 5: Interpolation');
    expect(sectionLabel('vi', 1, 'Giới thiệu')).toBe('Phần 1: Giới thiệu');
    expect(lessonLabel('vi', 3, 'Biến và kiểu dữ liệu')).toBe('Bài 3: Biến và kiểu dữ liệu');
  });

  it('không đánh số lần hai khi tiêu đề đã có số', () => {
    expect(lessonLabel('vi', 4, 'Bài 4: Vòng lặp')).toBe('Bài 4: Vòng lặp');
    expect(sectionLabel('en', 1, 'Part 1 - Basics')).toBe('Part 1 - Basics');
  });

  it('nhận diện ngôn ngữ từ mã, nhãn, hoặc tiêu đề', () => {
    expect(detectOutlineLang('vi', [])).toBe('vi');
    expect(detectOutlineLang('en-US', ['Xin chào'])).toBe('en');
    expect(detectOutlineLang('Tiếng Việt', [])).toBe('vi');
    expect(detectOutlineLang('Tiếng Anh', [])).toBe('en');
    expect(detectOutlineLang(null, ['Getting Started', 'Hello World'])).toBe('en');
    expect(detectOutlineLang(null, ['Giới thiệu khóa học'])).toBe('vi');
  });
});
