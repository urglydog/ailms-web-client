import { describe, expect, it } from 'vitest';
import { countUsers, filterAndSortUsers, paginate, type AdminUser } from './users';

const u = (over: Partial<AdminUser>): AdminUser => ({
  id: 1, fullName: 'An', email: 'an@x.vn', role: 'STUDENT', isActive: true, createdAt: '2026-01-01T00:00:00Z', ...over,
});
const users = [
  u({ id: 1, fullName: 'An', email: 'an@x.vn' }),
  u({ id: 2, fullName: 'Bình', email: 'binh@x.vn', role: 'INSTRUCTOR', createdAt: '2026-03-01T00:00:00Z' }),
  u({ id: 3, fullName: 'Chi', email: 'chi@x.vn', isActive: false, createdAt: '2026-02-01T00:00:00Z' }),
  u({ id: 4, fullName: 'Admin', email: 'root@x.vn', role: 'ADMIN' }),
];

describe('countUsers', () => {
  it('đếm theo vai trò và số tài khoản bị khóa', () => {
    expect(countUsers(users)).toEqual({ ALL: 4, STUDENT: 2, INSTRUCTOR: 1, ADMIN: 1, LOCKED: 1 });
  });
});

describe('filterAndSortUsers', () => {
  const base = { query: '', filter: 'ALL' as const, sortField: 'createdAt' as const, sortOrder: 'desc' as const };
  it('mặc định mới nhất trước', () => {
    expect(filterAndSortUsers(users, base).map((x) => x.id)).toEqual([2, 3, 1, 4]);
  });
  it('tìm theo tên hoặc email, không phân biệt hoa thường', () => {
    expect(filterAndSortUsers(users, { ...base, query: 'ROOT' }).map((x) => x.id)).toEqual([4]);
    expect(filterAndSortUsers(users, { ...base, query: 'bình' }).map((x) => x.id)).toEqual([2]);
  });
  it('lọc theo vai trò và theo "bị khóa"', () => {
    expect(filterAndSortUsers(users, { ...base, filter: 'INSTRUCTOR' }).map((x) => x.id)).toEqual([2]);
    expect(filterAndSortUsers(users, { ...base, filter: 'LOCKED' }).map((x) => x.id)).toEqual([3]);
  });
  it('sắp xếp theo tên tăng dần', () => {
    expect(filterAndSortUsers(users, { ...base, sortField: 'fullName', sortOrder: 'asc' }).map((x) => x.fullName)).toEqual(['Admin', 'An', 'Bình', 'Chi']);
  });
  it('không đổi mảng gốc', () => {
    const copy = [...users];
    filterAndSortUsers(users, base);
    expect(users).toEqual(copy);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);
  it('cắt trang và tính tổng trang', () => {
    expect(paginate(items, 3, 10)).toEqual({ items: [20, 21, 22, 23, 24], totalPages: 3, page: 3 });
  });
  it('kẹp trang vượt giới hạn và danh sách rỗng', () => {
    expect(paginate(items, 9, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toEqual({ items: [], totalPages: 1, page: 1 });
  });
});
