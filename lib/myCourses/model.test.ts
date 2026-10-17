import { describe, expect, it } from 'vitest';
import type { EnrolledCourse } from '@/types/domain';
import {
  certificateHref,
  countByStatus,
  filterAndSort,
  learnHref,
  pickCompleted,
  pickContinue,
  resolveViewMode,
  statusOf,
} from './model';

function makeEnrolled(id: number, overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
  return {
    courseId: id,
    courseTitle: `Khóa ${id}`,
    courseSlug: `khoa-${id}`,
    thumbnailUrl: null,
    categoryName: 'Lập trình',
    isFree: false,
    price: 100000,
    alreadyReviewed: false,
    progressPct: 30,
    completedAt: null,
    quizScore: null,
    firstLessonId: id * 10,
    instructorName: 'Trần Thanh Hà',
    myRating: null,
    enrolledAt: '2026-09-01T00:00:00',
    lastAccessedAt: null,
    certificateCode: null,
    ...overrides,
  };
}

describe('statusOf', () => {
  it('100% là hoàn thành, còn lại (kể cả 0%) là đang học', () => {
    expect(statusOf(makeEnrolled(1, { progressPct: 100 }))).toBe('completed');
    expect(statusOf(makeEnrolled(1, { progressPct: 99.9 }))).toBe('in-progress');
    expect(statusOf(makeEnrolled(1, { progressPct: 0 }))).toBe('in-progress');
  });
});

describe('countByStatus', () => {
  it('đếm tất cả, đang học và hoàn thành', () => {
    const list = [
      makeEnrolled(1, { progressPct: 10 }),
      makeEnrolled(2, { progressPct: 100 }),
      makeEnrolled(3, { progressPct: 0 }),
    ];
    expect(countByStatus(list)).toEqual({ all: 3, 'in-progress': 2, completed: 1 });
  });
});

describe('filterAndSort', () => {
  const list = [
    makeEnrolled(1, { courseTitle: 'Unity', progressPct: 60, enrolledAt: '2026-09-01T00:00:00', lastAccessedAt: '2026-10-10T00:00:00' }),
    makeEnrolled(2, { courseTitle: 'AI', progressPct: 100, enrolledAt: '2026-09-05T00:00:00', lastAccessedAt: '2026-10-15T00:00:00' }),
    makeEnrolled(3, { courseTitle: 'Tiếng Anh', progressPct: 20, enrolledAt: '2026-09-03T00:00:00', lastAccessedAt: null }),
  ];

  it('lọc theo trạng thái', () => {
    expect(filterAndSort(list, { status: 'completed', query: '', sort: 'title-asc' }).map((c) => c.courseId)).toEqual([2]);
    expect(filterAndSort(list, { status: 'in-progress', query: '', sort: 'title-asc' }).map((c) => c.courseId)).toEqual([3, 1]);
  });

  it('tìm theo tên không phân biệt hoa thường', () => {
    expect(filterAndSort(list, { status: 'all', query: 'unity', sort: 'title-asc' }).map((c) => c.courseId)).toEqual([1]);
  });

  it('sắp xếp theo lần truy cập gần nhất, chưa học xuống cuối', () => {
    expect(filterAndSort(list, { status: 'all', query: '', sort: 'recently-accessed' }).map((c) => c.courseId)).toEqual([2, 1, 3]);
  });

  it('sắp xếp theo ngày ghi danh gần nhất', () => {
    expect(filterAndSort(list, { status: 'all', query: '', sort: 'recently-enrolled' }).map((c) => c.courseId)).toEqual([2, 3, 1]);
  });

  it('sắp xếp theo tên A đến Z và Z đến A', () => {
    expect(filterAndSort(list, { status: 'all', query: '', sort: 'title-asc' }).map((c) => c.courseTitle)).toEqual(['AI', 'Tiếng Anh', 'Unity']);
    expect(filterAndSort(list, { status: 'all', query: '', sort: 'title-desc' }).map((c) => c.courseTitle)).toEqual(['Unity', 'Tiếng Anh', 'AI']);
  });

  it('không làm thay đổi mảng gốc', () => {
    const copy = [...list];
    filterAndSort(list, { status: 'all', query: '', sort: 'title-asc' });
    expect(list).toEqual(copy);
  });
});

describe('pickContinue', () => {
  it('chọn khóa đang học truy cập gần nhất', () => {
    const list = [
      makeEnrolled(1, { progressPct: 60, lastAccessedAt: '2026-10-10T00:00:00' }),
      makeEnrolled(2, { progressPct: 20, lastAccessedAt: '2026-10-16T00:00:00' }),
      makeEnrolled(3, { progressPct: 100, lastAccessedAt: '2026-10-17T00:00:00' }),
    ];
    expect(pickContinue(list)?.courseId).toBe(2);
  });

  it('khóa chưa học bài nào xếp theo ngày ghi danh', () => {
    const list = [
      makeEnrolled(1, { progressPct: 0, lastAccessedAt: null, enrolledAt: '2026-09-01T00:00:00' }),
      makeEnrolled(2, { progressPct: 0, lastAccessedAt: null, enrolledAt: '2026-09-09T00:00:00' }),
    ];
    expect(pickContinue(list)?.courseId).toBe(2);
  });

  it('null khi không còn khóa đang học', () => {
    expect(pickContinue([makeEnrolled(1, { progressPct: 100 })])).toBeNull();
    expect(pickContinue([])).toBeNull();
  });
});

describe('pickCompleted', () => {
  it('chọn khóa hoàn thành gần nhất', () => {
    const list = [
      makeEnrolled(1, { progressPct: 100, completedAt: '2026-10-01T00:00:00' }),
      makeEnrolled(2, { progressPct: 100, completedAt: '2026-10-12T00:00:00' }),
      makeEnrolled(3, { progressPct: 40 }),
    ];
    expect(pickCompleted(list)?.courseId).toBe(2);
  });

  it('null khi chưa hoàn thành khóa nào', () => {
    expect(pickCompleted([makeEnrolled(1)])).toBeNull();
  });
});

describe('learnHref', () => {
  it('ưu tiên bài đang học dở', () => {
    expect(learnHref(makeEnrolled(1, { resumeLessonId: 55, firstLessonId: 10 }))).toBe('/learn/55');
  });
  it('lùi về bài đầu khi backend chưa trả resumeLessonId', () => {
    expect(learnHref(makeEnrolled(1, { firstLessonId: 10 }))).toBe('/learn/10');
    expect(learnHref(makeEnrolled(1, { resumeLessonId: null, firstLessonId: 10 }))).toBe('/learn/10');
  });
  it('khóa chưa có bài nào thì về trang chi tiết khóa', () => {
    expect(learnHref(makeEnrolled(1, { firstLessonId: null }))).toBe('/courses/khoa-1');
  });
});

describe('certificateHref', () => {
  it('trỏ tới trang chứng chỉ khi có mã, null khi chưa có', () => {
    expect(certificateHref(makeEnrolled(1, { certificateCode: 'LL-2026-ABC' }))).toBe('/certificates/LL-2026-ABC');
    expect(certificateHref(makeEnrolled(1))).toBeNull();
  });
});

describe('resolveViewMode', () => {
  it('dùng lựa chọn đã lưu nếu hợp lệ', () => {
    expect(resolveViewMode('grid')).toBe('grid');
    expect(resolveViewMode('list')).toBe('list');
  });
  it('chưa lưu thì mặc định dạng thẻ', () => {
    expect(resolveViewMode(null)).toBe('grid');
  });
  it('giá trị lưu sai thì coi như chưa lưu', () => {
    expect(resolveViewMode('abc')).toBe('grid');
  });
});
