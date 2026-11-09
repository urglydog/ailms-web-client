import { describe, expect, it } from 'vitest';
import { INSTRUCTOR_NAV, activeNavItem, isFullPageRoute, isInstructorNavActive } from './nav';

describe('INSTRUCTOR_NAV', () => {
  it('có 5 mục theo thứ tự: khóa học, gói, giao tiếp, hiệu suất, công cụ', () => {
    expect(INSTRUCTOR_NAV.map((i) => i.id)).toEqual(['courses', 'bundles', 'communication', 'revenue', 'tools']);
    expect(INSTRUCTOR_NAV.every((i) => i.href.startsWith('/instructor/'))).toBe(true);
  });
});

describe('isInstructorNavActive', () => {
  it('khớp chính xác hoặc là trang con, không khớp tiền tố gần giống', () => {
    expect(isInstructorNavActive('/instructor/courses', '/instructor/courses')).toBe(true);
    expect(isInstructorNavActive('/instructor/courses/5/gradebook', '/instructor/courses')).toBe(true);
    expect(isInstructorNavActive('/instructor/courses-old', '/instructor/courses')).toBe(false);
  });
});

describe('activeNavItem', () => {
  it('trả về mục đang mở, hoặc null nếu không thuộc mục nào', () => {
    expect(activeNavItem('/instructor/revenue/students')?.id).toBe('revenue');
    expect(activeNavItem('/instructor/unknown-page')).toBeNull();
    expect(activeNavItem('/instructor')).toBeNull();
  });
  it('trang Live và Mã giảm giá thuộc nhóm Công cụ', () => {
    expect(activeNavItem('/instructor/coupons')?.id).toBe('tools');
    expect(activeNavItem('/instructor/live')?.id).toBe('tools');
  });
});

describe('isFullPageRoute', () => {
  it('tạo khóa mới và trang chỉnh sửa khóa là màn hình toàn trang', () => {
    expect(isFullPageRoute('/instructor/courses/new')).toBe(true);
    expect(isFullPageRoute('/instructor/courses/12/edit')).toBe(true);
    expect(isFullPageRoute('/instructor/courses/12/edit/curriculum')).toBe(true);
  });
  it('các trang quản lý khác thì không', () => {
    expect(isFullPageRoute('/instructor/courses')).toBe(false);
    expect(isFullPageRoute('/instructor/courses/12/gradebook')).toBe(false);
  });
});
