import { describe, expect, it } from 'vitest';
import type { PublicCertificate } from '@/types/domain';
import { certificateTopics, filterByTopic, resolveProfileTab, sortCertificates } from './model';

function cert(code: string, title: string, topic: string, issuedAt: string): PublicCertificate {
  return {
    certificateCode: code,
    courseTitle: title,
    studentName: 'A',
    courseHours: 1,
    instructorName: 'B',
    completedAt: issuedAt,
    verifyUrl: `https://x/verify/${code}`,
    courseCategoryName: topic,
    issuedAt,
    status: 'ACTIVE',
  } as PublicCertificate;
}

const LIST = [
  cert('A', 'Unity cơ bản', 'Lập trình', '2026-09-27T00:00:00'),
  cert('B', 'Tiếng Anh cho IT', 'Ngoại ngữ', '2026-10-15T00:00:00'),
  cert('C', 'Marketing', 'Kinh doanh', '2026-10-01T00:00:00'),
  cert('D', 'Python', 'Lập trình', '2026-08-01T00:00:00'),
];

describe('resolveProfileTab', () => {
  it('mặc định mở tab Chứng chỉ', () => {
    expect(resolveProfileTab(null)).toBe('certificates');
    expect(resolveProfileTab('')).toBe('certificates');
    expect(resolveProfileTab('khong-co')).toBe('certificates');
  });
  it('nhận các tab hợp lệ', () => {
    expect(resolveProfileTab('courses')).toBe('courses');
    expect(resolveProfileTab('wishlist')).toBe('wishlist');
    expect(resolveProfileTab('certificates')).toBe('certificates');
  });
});

describe('sortCertificates', () => {
  it('mới nhất và cũ nhất theo ngày cấp', () => {
    expect(sortCertificates(LIST, 'newest').map((c) => c.certificateCode)).toEqual(['B', 'C', 'A', 'D']);
    expect(sortCertificates(LIST, 'oldest').map((c) => c.certificateCode)).toEqual(['D', 'A', 'C', 'B']);
  });
  it('theo tên khóa A đến Z (tiếng Việt)', () => {
    expect(sortCertificates(LIST, 'title').map((c) => c.courseTitle)).toEqual([
      'Marketing',
      'Python',
      'Tiếng Anh cho IT',
      'Unity cơ bản',
    ]);
  });
  it('theo chủ đề', () => {
    expect(sortCertificates(LIST, 'topic').map((c) => c.courseCategoryName)).toEqual([
      'Kinh doanh',
      'Lập trình',
      'Lập trình',
      'Ngoại ngữ',
    ]);
  });
  it('không đổi mảng gốc', () => {
    const copy = [...LIST];
    sortCertificates(LIST, 'title');
    expect(LIST).toEqual(copy);
  });
});

describe('certificateTopics và filterByTopic', () => {
  it('liệt kê chủ đề duy nhất theo thứ tự chữ cái', () => {
    expect(certificateTopics(LIST)).toEqual(['Kinh doanh', 'Lập trình', 'Ngoại ngữ']);
    expect(certificateTopics([])).toEqual([]);
  });
  it('lọc theo chủ đề, null là tất cả', () => {
    expect(filterByTopic(LIST, 'Lập trình').map((c) => c.certificateCode)).toEqual(['A', 'D']);
    expect(filterByTopic(LIST, null)).toHaveLength(4);
    expect(filterByTopic(LIST, 'Khong co')).toEqual([]);
  });
});
