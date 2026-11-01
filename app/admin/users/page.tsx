'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, TriangleAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api/client';
import {
  countUsers,
  filterAndSortUsers,
  paginate,
  type AdminUser,
  type SortOrder,
  type UserFilter,
  type UserSortField,
} from '@/lib/admin/users';

/** Auto-ban bằng AI (25/09/2026) — đề xuất khoá đang chờ Admin duyệt, xem AiLockScanService. */
interface AiLockProposal {
  userId: number;
  email: string;
  fullName: string;
  aiLockProposedAt: string;
  aiLockProposedReason: string;
}

const FILTERS: UserFilter[] = ['ALL', 'STUDENT', 'INSTRUCTOR', 'ADMIN', 'LOCKED', 'SPAM'];
const PAGE_SIZE = 10;

/** Quản lý người dùng: bộ lọc nhanh có đếm, tìm kiếm, bảng sắp xếp được, phân trang; khóa/mở khóa luôn hỏi xác nhận. */
export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLockProposals, setAiLockProposals] = useState<AiLockProposal[]>([]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [sortField, setSortField] = useState<UserSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pendingBlock, setPendingBlock] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers(await api.get<AdminUser[]>('/api/v1/users'));
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  const fetchAiLockProposals = useCallback(async () => {
    try {
      setAiLockProposals(await api.get<AiLockProposal[]>('/api/v1/admin/ai-lock-proposals'));
    } catch {
      // Không có gì nghiêm trọng nếu mục này lỗi — không chặn danh sách người dùng chính.
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchAiLockProposals()]).finally(() => setLoading(false));
  }, [fetchUsers, fetchAiLockProposals]);

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  const handleConfirmLockProposal = async (userId: number) => {
    try {
      await api.post(`/api/v1/admin/users/${userId}/confirm-lock-proposal`);
      toast.success(t('ai.confirmed'));
      void fetchAiLockProposals();
      void fetchUsers();
    } catch {
      toast.error(t('ai.confirmError'));
    }
  };

  const handleDismissLockProposal = async (userId: number) => {
    try {
      await api.post(`/api/v1/admin/users/${userId}/dismiss-lock-proposal`);
      toast.success(t('ai.dismissed'));
      void fetchAiLockProposals();
    } catch {
      toast.error(t('ai.dismissError'));
    }
  };

  const doToggleBlock = async (user: AdminUser) => {
    setPendingBlock(null);
    try {
      await api.put(`/api/v1/users/${user.id}`, { fullName: user.fullName, role: user.role, isActive: !user.isActive });
      toast.success(user.isActive ? t('lockedToast') : t('unlockedToast'));
      void fetchUsers();
    } catch {
      toast.error(t('updateError'));
    }
  };

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const counts = useMemo(() => countUsers(users), [users]);
  const filtered = useMemo(() => filterAndSortUsers(users, { query, filter, sortField, sortOrder }), [users, query, filter, sortField, sortOrder]);
  const paged = paginate(filtered, page, PAGE_SIZE);

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {aiLockProposals.length > 0 && (
        <section aria-labelledby="ai-lock-title" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-white p-4">
          <h2 id="ai-lock-title" className="m-0 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <TriangleAlert size={18} className="text-warning" aria-hidden />
            {t('ai.title', { count: aiLockProposals.length })}
          </h2>
          {aiLockProposals.map((p) => (
            <div key={p.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
              <div className="min-w-0">
                <div className="font-semibold text-ink">
                  {p.fullName} <span className="font-normal text-ink-muted">({p.email})</span>
                </div>
                <div className="mt-0.5 text-sm text-ink-muted">{p.aiLockProposedReason}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => handleConfirmLockProposal(p.userId)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
                  {t('ai.confirm')}
                </button>
                <button type="button" onClick={() => handleDismissLockProposal(p.userId)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-tint">
                  {t('ai.dismiss')}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t('filtersAria')} className="flex flex-wrap gap-2">
          {FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === id ? 'bg-accent text-white' : 'border border-line bg-white text-ink-muted hover:border-accent hover:text-ink'
              }`}
            >
              {t(`filter.${id}`)} <span className={filter === id ? 'text-white/85' : 'text-ink-muted'}>({counts[id].toLocaleString(locale)})</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">{t('searchLabel')}</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPh')}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : (
        <UsersTable users={paged.items} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} onToggleBlock={setPendingBlock} />
      )}

      {!loading && paged.totalPages > 1 && (
        <nav aria-label={t('pager.aria')} className="flex flex-wrap items-center justify-between gap-3 px-1">
          <span className="text-sm text-ink-muted">{t('pager.showing', { shown: paged.items.length, total: filtered.length })}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">
              {t('pager.prev')}
            </button>
            <span className="px-2 text-sm font-semibold text-ink">{t('pager.page', { page: paged.page, total: paged.totalPages })}</span>
            <button type="button" disabled={paged.page === paged.totalPages} onClick={() => setPage(paged.page + 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-tint disabled:opacity-50">
              {t('pager.next')}
            </button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={pendingBlock !== null}
        tone={pendingBlock?.isActive ? 'danger' : 'primary'}
        title={pendingBlock?.isActive ? t('confirm.lockTitle') : t('confirm.unlockTitle')}
        body={pendingBlock ? (pendingBlock.isActive ? t('confirm.lockBody', { name: pendingBlock.fullName }) : t('confirm.unlockBody', { name: pendingBlock.fullName })) : ''}
        confirmLabel={pendingBlock?.isActive ? t('lock') : t('unlock')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={() => pendingBlock && void doToggleBlock(pendingBlock)}
        onCancel={() => setPendingBlock(null)}
      />
    </>
  );
}
