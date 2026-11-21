'use client';

import { useMemo, useState } from 'react';
import { Search, Share2 } from 'lucide-react';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { PromotionPanel } from '@/components/share/PromotionPanel';
import { ShareCourseDialog } from '@/components/share/ShareCourseDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { useShareCourses } from '@/hooks/useShareCourses';
import { money } from '@/lib/finance';
import type { CourseShare } from '@/types/finance';

const RANGES = [
  { id: 'all', label: 'Toàn thời gian', days: null },
  { id: '30', label: '30 ngày', days: 30 },
  { id: '90', label: '90 ngày', days: 90 },
] as const;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Số khóa mỗi trang: cố định để vị trí các khối bên dưới (đăng ký quảng bá) không nhảy theo số khóa. */
const PAGE_SIZE = 5;
type StatusFilter = 'all' | 'published' | 'unpublished';
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'published', label: 'Đã xuất bản' },
  { id: 'unpublished', label: 'Chưa xuất bản' },
];

/** Tìm không phân biệt dấu/hoa thường (gõ "tieng anh" ra "Tiếng Anh"). */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/**
 * "Chia sẻ & Quảng bá" của giảng viên (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn D): mỗi khóa có link giới thiệu riêng
 * (học viên mua qua link được tính tỷ lệ giới thiệu cao hơn) và nút chia sẻ. Thống kê chỉ đo ĐƠN MUA đã thanh toán, chia theo
 * nguồn (link của bạn vs tự tìm thấy trên nền tảng); lượt xem/click chưa đo (hoãn có chủ đích, xem docs/PAYMENT_PAYOUT_EPIC.md).
 */
export default function InstructorSharePage() {
  const [rangeId, setRangeId] = useState<(typeof RANGES)[number]['id']>('all');
  const [sharing, setSharing] = useState<CourseShare | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[0];
  const from = range.days ? isoDate(new Date(Date.now() - range.days * 24 * 60 * 60 * 1000)) : undefined;
  const { data, isLoading, isError } = useShareCourses(from);

  const filtered = useMemo(() => {
    const q = fold(keyword.trim());
    return (data ?? []).filter(
      (c) =>
        (!q || fold(c.title).includes(q)) &&
        (statusFilter === 'all' || (statusFilter === 'published' ? c.shareable : !c.shareable)),
    );
  }, [data, keyword, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Chia sẻ & Quảng bá"
        subtitle="Mỗi khóa có một link giới thiệu riêng: học viên mua qua link của bạn thì bạn hưởng tỷ lệ cao hơn so với khi họ tự tìm thấy khóa trên nền tảng."
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Khoảng thời gian thống kê">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={rangeId === r.id}
            onClick={() => setRangeId(r.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${rangeId === r.id ? 'border-accent bg-tint text-accent-dark' : 'border-line bg-surface-raised text-ink-muted hover:text-ink'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 sm:max-w-sm">
          <Search size={15} aria-hidden className="shrink-0 text-ink-muted" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm khóa học..."
            aria-label="Tìm khóa học"
            className="w-full bg-transparent text-sm text-ink outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={statusFilter === f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setPage(1);
              }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${statusFilter === f.id ? 'border-accent bg-tint text-accent-dark' : 'border-line bg-surface-raised text-ink-muted hover:text-ink'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">Không tải được danh sách khóa học.</div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Bạn chưa có khóa học nào.</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center text-ink-muted">Không có khóa học nào khớp bộ lọc.</div>
      ) : (
        <>
        <ul className="m-0 flex min-h-[44rem] list-none flex-col gap-3 p-0">
          {pageItems.map((c) => (
            <li key={c.courseId} className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{c.title}</div>
                  <div className="text-xs text-ink-muted">
                    {c.shareable ? 'Đã xuất bản' : 'Chưa xuất bản — chưa có link dùng được'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!c.shareable}
                  onClick={() => setSharing(c)}
                  title={c.shareable ? 'Lấy link giới thiệu và chia sẻ' : 'Xuất bản khóa học để chia sẻ'}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" aria-hidden /> Chia sẻ
                </button>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-ink-muted">Đơn qua link của bạn</dt>
                  <dd className="m-0 font-semibold text-ink">{c.referralOrders}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Thu nhập qua link</dt>
                  <dd className="m-0 font-semibold text-success-ink">{money(c.referralEarning)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Đơn tự tìm thấy</dt>
                  <dd className="m-0 font-semibold text-ink">{c.organicOrders}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Thu nhập tự tìm thấy</dt>
                  <dd className="m-0 font-semibold text-ink">{money(c.organicEarning)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {data && data.length > 0 && <PromotionPanel courses={data} />}

      {sharing && (
        <ShareCourseDialog open onClose={() => setSharing(null)} title={sharing.title} slug={sharing.slug} referralCode={sharing.referralCode} />
      )}
    </>
  );
}
