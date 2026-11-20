'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { Pager } from '@/components/ui/SearchPanel';
import { useDebounce } from '@/hooks/useDebounce';
import { useInstructorCourseOptions, useInstructorStudentPage, useInstructorStudentSummary } from '@/hooks/useDashboard';
import { dashboardApi } from '@/lib/api/dashboard';
import { exportToCsv } from '@/lib/exportCsv';

const AT_RISK_WARNING_RATIO = 0.3;

/** "Hiệu suất" > Sinh viên — danh sách học viên đã ghi danh trên các khóa của giảng viên
 * (19/09/2026, xây mới — trước đây `/instructor/students` chỉ là placeholder). */

export default function InstructorStudentsPage() {
  const t = useTranslations('instructor.perf');
  const locale = useLocale();
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();

  // Danh sách hiển thị theo mục đích: mặc định chỉ những học viên cần chú ý (tiến độ thấp) để giảng viên hành động; xem tất cả hoặc tìm theo tên/email/khóa khi cần.
  // Lọc, tìm kiếm, phân trang và số liệu tổng quan đều do máy chủ tính nên đúng với mọi số lượng học viên.
  const [view, setView] = useState<'risk' | 'all'>('risk');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [page, setPage] = useState(0);
  const { data: pageData, isLoading } = useInstructorStudentPage({ courseId: courseId || undefined, atRiskOnly: view === 'risk', q: debouncedQuery, page });
  const { data: stats } = useInstructorStudentSummary(courseId || undefined);
  const visible = pageData?.content ?? [];
  const atRiskThreshold = stats?.atRiskBelowPct ?? 20;
  const atRiskRatio = stats && stats.total > 0 ? stats.atRiskCount / stats.total : 0;

  const handleExport = async () => {
    // Xuất CSV cần toàn bộ danh sách nên chỉ tải khi bấm nút.
    const all = await dashboardApi.getStudents(courseId || undefined);
    if (all.length === 0) return;
    exportToCsv(
      'hoc-vien.csv',
      all.map((s) => ({
        [t('students.cols.student')]: s.studentName,
        [t('students.cols.email')]: s.studentEmail,
        [t('students.cols.course')]: s.courseTitle,
        [t('students.cols.enrolled')]: new Date(s.enrolledAt).toLocaleDateString(locale),
        [t('students.csv.progress')]: s.progressPct,
      })),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('students.title')}</h1>
        <div className="flex items-center gap-2">
          <select
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
            className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-[13px] font-semibold text-ink focus:border-accent focus:outline-none"
          >
            <option value="">{t('common.allCourses')}</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={!stats || stats.total === 0}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon /> {t('students.export')}
          </button>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('students.total')} value={String(stats.total)} />
          <StatCard label={t('students.avgProgress')} value={`${stats.avgProgress.toFixed(0)}%`} />
          <StatCard
            label={t('students.atRisk', { pct: atRiskThreshold })}
            value={String(stats.atRiskCount)}
            tone={stats.atRiskCount > 0 ? 'text-danger' : 'text-ink'}
          />
        </div>
      )}

      {stats && atRiskRatio > AT_RISK_WARNING_RATIO && (
        <InsightCallout tone="warning">
          {t('students.atRiskWarn', { ratio: (atRiskRatio * 100).toFixed(0), pct: atRiskThreshold })}
        </InsightCallout>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Chế độ xem" className="flex gap-2">
          <button
            type="button"
            aria-pressed={view === 'risk'}
            onClick={() => {
              setView('risk');
              setPage(0);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${view === 'risk' ? 'bg-accent text-white' : 'border border-line bg-surface-raised text-ink-muted hover:text-ink'}`}
          >
            Cần chú ý{stats ? ` (${stats.atRiskCount})` : ''}
          </button>
          <button
            type="button"
            aria-pressed={view === 'all'}
            onClick={() => {
              setView('all');
              setPage(0);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${view === 'all' ? 'bg-accent text-white' : 'border border-line bg-surface-raised text-ink-muted hover:text-ink'}`}
          >
            Tất cả{stats ? ` (${stats.total})` : ''}
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Tìm theo tên, email hoặc khóa học..."
          aria-label="Tìm học viên"
          className="ml-auto w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent sm:w-72"
        />
      </div>

      {/* (26/09/2026, sửa lỗi) — cột cố định không co giãn dưới `lg`, bọc cuộn ngang thay vì bóp/vỡ. */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
        <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-[1.4fr_1.4fr_1fr_140px_140px] gap-3 border-b border-line bg-surface px-4 py-2.5 text-[11.5px] font-bold text-ink-muted">
          <span>{t('students.cols.student')}</span>
          <span>{t('students.cols.email')}</span>
          <span>{t('students.cols.course')}</span>
          <span>{t('students.cols.enrolled')}</span>
          <span>{t('students.cols.progress')}</span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-ink-muted">{t('common.loading')}</div>}
        {!isLoading && stats && stats.total === 0 && <div className="p-10 text-center text-sm text-ink-muted">{t('students.empty')}</div>}
        {!isLoading && stats && stats.total > 0 && visible.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-muted">
            {view === 'risk' && !query.trim() ? 'Không có học viên nào cần chú ý. Chọn "Tất cả" để xem toàn bộ học viên.' : 'Không có học viên nào khớp.'}
          </div>
        )}

        {visible.map((s, idx, shown) => (
          <div
            key={idx}
            className={`grid min-w-[680px] grid-cols-[1.4fr_1.4fr_1fr_140px_140px] items-center gap-3 px-4 py-2.5 text-[13px] ${
              idx < shown.length - 1 ? 'border-b border-line-soft' : ''
            }`}
          >
            <span className="truncate font-semibold text-ink">{s.studentName}</span>
            <span className="truncate text-ink-muted">{s.studentEmail}</span>
            <span className="truncate text-ink">{s.courseTitle}</span>
            <span className="text-ink-muted">{new Date(s.enrolledAt).toLocaleDateString(locale)}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-line-soft">
                <div className="h-full rounded-full bg-accent" style={{ width: `${s.progressPct}%` }} />
              </div>
              <span className="text-[11.5px] text-ink-muted">{s.progressPct}%</span>
            </div>
          </div>
        ))}
        </div>
        <div className="border-t border-line px-4 py-3">
          <Pager page={page} totalPages={Math.max(1, pageData?.totalPages ?? 1)} total={pageData?.totalElements ?? 0} onPage={setPage} />
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-ink-muted">{label}</span>
      <div className={`mt-1 font-display text-[22px] font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
