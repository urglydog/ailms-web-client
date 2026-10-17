import { describe, expect, it } from 'vitest';
import { buildAccountMenu, isNavItemActive } from './navModel';

const ids = (groups: ReturnType<typeof buildAccountMenu>) => groups.flatMap((g) => g.items.map((i) => i.id));

describe('isNavItemActive', () => {
  it('khớp chính xác hoặc trang con', () => {
    expect(isNavItemActive('/courses', '/courses')).toBe(true);
    expect(isNavItemActive('/courses/react-co-ban', '/courses')).toBe(true);
  });
  it('không khớp đường dẫn chỉ trùng tiền tố chữ', () => {
    expect(isNavItemActive('/liveness', '/live')).toBe(false);
    expect(isNavItemActive('/', '/courses')).toBe(false);
  });
});

describe('buildAccountMenu', () => {
  it('học viên có nhóm học tập, tài khoản và lời mời trở thành giảng viên', () => {
    const groups = buildAccountMenu({ id: 7, role: 'STUDENT' });
    expect(ids(groups)).toEqual([
      'myCourses', 'wishlist', 'certificates',
      'publicProfile', 'payments', 'profile',
      'becomeInstructor',
    ]);
  });

  it('chứng chỉ và hồ sơ công khai trỏ theo id người dùng', () => {
    const items = buildAccountMenu({ id: 7, role: 'STUDENT' }).flatMap((g) => g.items);
    expect(items.find((i) => i.id === 'certificates')?.href).toBe('/u/7?tab=certificates');
    expect(items.find((i) => i.id === 'publicProfile')?.href).toBe('/u/7');
  });

  it('giảng viên thấy Kênh giảng viên thay vì lời mời', () => {
    const list = ids(buildAccountMenu({ id: 7, role: 'INSTRUCTOR' }));
    expect(list).toContain('instructorChannel');
    expect(list).not.toContain('becomeInstructor');
  });

  it('admin có nhóm quản trị đứng đầu và không có lời mời giảng viên', () => {
    const groups = buildAccountMenu({ id: 7, role: 'ADMIN' });
    expect(groups[0]?.id).toBe('admin');
    expect(groups[0]?.items[0]?.href).toBe('/admin');
    expect(ids(groups)).not.toContain('becomeInstructor');
  });

  it('chưa có id thì bỏ các mục cần id', () => {
    const list = ids(buildAccountMenu({ id: null, role: 'STUDENT' }));
    expect(list).not.toContain('certificates');
    expect(list).not.toContain('publicProfile');
  });

  it('mọi mục có id duy nhất', () => {
    const list = ids(buildAccountMenu({ id: 7, role: 'STUDENT' }));
    expect(new Set(list).size).toBe(list.length);
  });
});
