'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { AdminUser, SortOrder, UserSortField } from '@/lib/admin/users';

interface UsersTableProps {
  users: AdminUser[];
  sortField: UserSortField;
  sortOrder: SortOrder;
  onSort: (field: UserSortField) => void;
  onToggleBlock: (user: AdminUser) => void;
}

const COLUMNS: UserSortField[] = ['fullName', 'email', 'createdAt', 'role'];

const ROLE_CLASS: Record<string, string> = {
  ADMIN: 'bg-tint text-accent-dark',
  INSTRUCTOR: 'bg-white text-ink border border-accent/40',
  STUDENT: 'bg-surface text-ink-muted border border-line',
};

/** Bảng người dùng: tiêu đề cột là nút sắp xếp (có aria-sort), vai trò/trạng thái dịch được, hành động Khóa/Mở khóa
 * (không áp dụng cho Quản trị viên). Cuộn ngang trong khung khi màn hình hẹp. */
export function UsersTable({ users, sortField, sortOrder, onSort, onToggleBlock }: UsersTableProps) {
  const t = useTranslations('admin.users');
  const locale = useLocale();

  const ariaSort = (field: UserSortField) => (sortField !== field ? 'none' : sortOrder === 'asc' ? 'ascending' : 'descending');

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line bg-surface text-xs text-ink-muted">
          <tr>
            {COLUMNS.map((field) => {
              const Icon = sortField !== field ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th key={field} scope="col" aria-sort={ariaSort(field)} className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1.5 font-semibold text-ink-muted hover:text-ink">
                    {t(`cols.${field}`)}
                    <Icon size={13} aria-hidden className={sortField === field ? 'text-accent' : 'opacity-50'} />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-4 py-3 font-semibold">
              {t('cols.status')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t('cols.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                {t('empty')}
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 no-underline hover:underline">
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint font-display text-[13px] font-bold text-accent-dark">
                      {user.fullName.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="font-semibold text-ink">{user.fullName}</span>
                    {user.isSpamFlagged && (
                      <span title={t('filter.SPAM')} className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                        <TriangleAlert size={11} aria-hidden />
                        {t('filter.SPAM')}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                <td className="px-4 py-3 text-ink-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ROLE_CLASS[user.role] ?? ROLE_CLASS.STUDENT}`}>
                    {t(`role.${user.role}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.isActive ? 'text-success-ink' : 'text-danger'}`}>
                    <span aria-hidden className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-success' : 'bg-danger'}`} />
                    {user.isActive ? t('active') : t('locked')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {user.role !== 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => onToggleBlock(user)}
                      aria-label={`${user.isActive ? t('lock') : t('unlock')}: ${user.fullName}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        user.isActive ? 'text-danger hover:bg-danger/10' : 'text-success-ink hover:bg-success-tint'
                      }`}
                    >
                      {user.isActive ? t('lock') : t('unlock')}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
