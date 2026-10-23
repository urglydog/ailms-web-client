export type UserRoleName = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  isSpamFlagged?: boolean;
}

export type UserFilter = 'ALL' | UserRoleName | 'LOCKED' | 'SPAM';
export type UserSortField = 'id' | 'fullName' | 'email' | 'role' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export type UserCounts = Record<UserFilter, number>;

/** Số người dùng theo từng bộ lọc nhanh (tất cả, từng vai trò, bị khóa). */
export function countUsers(users: AdminUser[]): UserCounts {
  const counts: UserCounts = { ALL: users.length, STUDENT: 0, INSTRUCTOR: 0, ADMIN: 0, LOCKED: 0, SPAM: 0 };
  for (const user of users) {
    if (user.role === 'STUDENT' || user.role === 'INSTRUCTOR' || user.role === 'ADMIN') counts[user.role] += 1;
    if (!user.isActive) counts.LOCKED += 1;
    if (user.isSpamFlagged) counts.SPAM += 1;
  }
  return counts;
}

interface FilterArgs {
  query: string;
  filter: UserFilter;
  sortField: UserSortField;
  sortOrder: SortOrder;
}

/** Lọc theo từ khóa (tên/email) và bộ lọc nhanh, rồi sắp xếp; trả về mảng mới. */
export function filterAndSortUsers(users: AdminUser[], { query, filter, sortField, sortOrder }: FilterArgs): AdminUser[] {
  const q = query.trim().toLowerCase();
  const result = users.filter((u) => {
    if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (filter === 'LOCKED') return !u.isActive;
    if (filter === 'SPAM') return !!u.isSpamFlagged;
    if (filter !== 'ALL') return u.role === filter;
    return true;
  });
  const value = (u: AdminUser): string | number => {
    if (sortField === 'createdAt') return u.createdAt ? new Date(u.createdAt).getTime() : 0;
    if (sortField === 'id') return u.id;
    return u[sortField].toLowerCase();
  };
  const dir = sortOrder === 'asc' ? 1 : -1;
  return result.sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    return va < vb ? -dir : va > vb ? dir : 0;
  });
}

export function paginate<T>(items: T[], page: number, size: number): { items: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((current - 1) * size, current * size), totalPages, page: current };
}
