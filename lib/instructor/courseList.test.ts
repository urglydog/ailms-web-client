import { describe, expect, it } from 'vitest';
import type { InstructorCourseSummary } from '@/types/domain';
import { countByStatus, filterAndSortCourses, nextAction } from './courseList';

function course(id: number, overrides: Partial<InstructorCourseSummary> = {}): InstructorCourseSummary {
  return {
    id,
    title: `Khóa ${id}`,
    slug: `khoa-${id}`,
    status: 'DRAFT',
    thumbnailUrl: null,
    categoryName: 'Lập trình',
    price: 0,
    isFree: true,
    avgRating: 0,
    totalLessons: 4,
    createdAt: `2026-10-0${id}T00:00:00`,
    completionPercent: 50,
    ...overrides,
  };
}

describe('countByStatus', () => {
  it('đếm theo từng trạng thái kèm tổng và số cần xử lý (nháp, bị từ chối)', () => {
    const list = [
      course(1, { status: 'PUBLISHED' }),
      course(2, { status: 'DRAFT' }),
      course(3, { status: 'REJECTED' }),
      course(4, { status: 'PENDING' }),
      course(5, { status: 'PUBLISHED' }),
    ];
    expect(countByStatus(list)).toEqual({
      ALL: 5,
      DRAFT: 1,
      PENDING: 1,
      PUBLISHED: 2,
      REJECTED: 1,
      ARCHIVED: 0,
      attention: 2,
    });
  });
  it('danh sách rỗng cho toàn số 0', () => {
    expect(countByStatus([]).ALL).toBe(0);
    expect(countByStatus([]).attention).toBe(0);
  });
});

describe('filterAndSortCourses', () => {
  const list = [
    course(1, { title: 'Bravo', status: 'PUBLISHED' }),
    course(2, { title: 'alpha', status: 'DRAFT' }),
    course(3, { title: 'Charlie', status: 'PUBLISHED' }),
  ];
  it('lọc theo trạng thái', () => {
    expect(filterAndSortCourses(list, { status: 'PUBLISHED', query: '', sort: 'newest' }).map((c) => c.id)).toEqual([3, 1]);
  });
  it('lọc theo từ khóa, không phân biệt hoa thường', () => {
    expect(filterAndSortCourses(list, { status: 'ALL', query: 'ALPHA', sort: 'newest' }).map((c) => c.id)).toEqual([2]);
  });
  it('sắp xếp mới nhất, cũ nhất, A-Z, Z-A', () => {
    const ids = (sort: 'newest' | 'oldest' | 'az' | 'za') => filterAndSortCourses(list, { status: 'ALL', query: '', sort }).map((c) => c.id);
    expect(ids('newest')).toEqual([3, 2, 1]);
    expect(ids('oldest')).toEqual([1, 2, 3]);
    expect(ids('az')).toEqual([2, 1, 3]);
    expect(ids('za')).toEqual([3, 1, 2]);
  });
  it('không đổi mảng gốc', () => {
    const copy = [...list];
    filterAndSortCourses(list, { status: 'ALL', query: '', sort: 'az' });
    expect(list).toEqual(copy);
  });
});

describe('nextAction', () => {
  it('nháp chưa đủ thì hoàn thiện, nháp đủ 100% thì gửi duyệt', () => {
    expect(nextAction(course(1, { status: 'DRAFT', completionPercent: 60 }))).toBe('complete');
    expect(nextAction(course(1, { status: 'DRAFT', completionPercent: 100 }))).toBe('submit');
  });
  it('bị từ chối, lưu trữ, chờ duyệt, đã xuất bản', () => {
    expect(nextAction(course(1, { status: 'REJECTED' }))).toBe('fixRejected');
    expect(nextAction(course(1, { status: 'ARCHIVED' }))).toBe('reactivate');
    expect(nextAction(course(1, { status: 'PENDING' }))).toBe('waiting');
    expect(nextAction(course(1, { status: 'PUBLISHED' }))).toBe('live');
  });
});
