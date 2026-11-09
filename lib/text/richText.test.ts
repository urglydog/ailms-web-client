import { describe, expect, it } from 'vitest';
import { parseRichText, plainSummary } from './richText';

const SAMPLE = [
  '## Giới thiệu',
  'Khóa học nhập môn.',
  '',
  '## Bạn sẽ học được',
  '• Cú pháp cơ bản',
  '• Hàm và lớp',
  '',
  '**Giảng viên:** Mosh',
  '**Nội dung:** 22 bài',
].join('\n');

describe('parseRichText', () => {
  it('nhận diện tiêu đề, đoạn văn, danh sách và dòng nhãn đậm', () => {
    const blocks = parseRichText(SAMPLE);
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'heading', 'list', 'fields']);
    expect(blocks[3]).toEqual({ type: 'list', items: ['Cú pháp cơ bản', 'Hàm và lớp'] });
    expect(blocks[4]).toEqual({
      type: 'fields',
      items: [
        { label: 'Giảng viên', value: 'Mosh' },
        { label: 'Nội dung', value: '22 bài' },
      ],
    });
  });

  it('văn bản thuần không có định dạng vẫn thành các đoạn văn', () => {
    const blocks = parseRichText('Dòng một.\n\nDòng hai.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Dòng một.' },
      { type: 'paragraph', text: 'Dòng hai.' },
    ]);
  });

  it('chuỗi rỗng không tạo khối nào', () => {
    expect(parseRichText('')).toEqual([]);
    expect(parseRichText(null)).toEqual([]);
  });
});

describe('plainSummary', () => {
  it('lấy đoạn văn đầu tiên, bỏ tiêu đề và định dạng', () => {
    expect(plainSummary(SAMPLE)).toBe('Khóa học nhập môn.');
  });

  it('cắt gọn khi quá dài', () => {
    const long = 'a'.repeat(400);
    const out = plainSummary(long, 100);
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out.endsWith('…')).toBe(true);
  });

  it('văn bản thuần trả về nguyên đoạn đầu', () => {
    expect(plainSummary('Chỉ một câu.')).toBe('Chỉ một câu.');
  });
});
