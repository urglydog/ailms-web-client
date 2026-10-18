'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { InsightCallout } from '@/components/instructor/InsightCallout';
import { DownloadIcon } from '@/components/instructor/SidebarIcons';
import { useInstructorCourseOptions, useInstructorStudents } from '@/hooks/useDashboard';
import { exportToCsv } from '@/lib/exportCsv';

const AT_RISK_THRESHOLD_PCT = 20;
const AT_RISK_WARNING_RATIO = 0.3;

/** "Hiệu suất" > Sinh viên — danh sách học viên đã ghi danh trên các khóa của giảng viên
 * (19/09/2026, xây mới — trước đây `/instructor/students` chỉ là placeholder). */
export default function InstructorStudentsPage() {
  const t = useTranslations('instructor.perf');
  const locale = useLocale();
  const [courseId, setCourseId] = useState<number | ''>('');
  const { data: courses } = useInstructorCourseOptions();
  const { data: students, isLoading } = useInstructorStudents(courseId || undefined);

  const stats = useMemo(() => {
    if (!students || students.length === 0) return null;
    const avgProgress = students.reduce((sum, s) => sum + s.progressPct, 0) / students.length;
    const atRiskCount = students.filter((s) => s.progressPct < AT_RISK_THRESHOLD_PCT).length;
    return { total: students.length, avgProgress, atRiskCount, atRiskRatio: atRiskCount / students.length };
  }, [students]);

  const handleExport = () => {
    if (!students || students.length === 0) return;
    exportToCsv(
      'hoc-vien.csv',
      students.map((s) => ({
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
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink focus:border-accent focus:outline-none"
          >
            <option value="">{t('common.allCourses')}</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={!students || students.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon /> {t('students.export')}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('students.total')} value={String(stats.total)} />
          <StatCard label={t('students.avgProgress')} value={`${stats.avgProgress.toFixed(0)}%`} />
          <StatCard
            label={t('students.atRisk', { pct: AT_RISK_THRESHOLD_PCT })}
            value={String(stats.atRiskCount)}
            tone={stats.atRiskCount > 0 ? 'text-danger' : 'text-ink'}
          />
        </div>
      )}

      {stats && stats.atRiskRatio > AT_RISK_WARNING_RATIO && (
        <InsightCallout tone="warning">
          {t('students.atRiskWarn', { ratio: (stats.atRiskRatio * 100).toFixed(0), pct: AT_RISK_THRESHOLD_PCT })}
        </InsightCallout>
      )}

      {/* (26/09/2026, sửa lỗi) — cột cố định không co giãn dưới `lg`, bọc cuộn ngang thay vì bóp/vỡ. */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-[1.4fr_1.4fr_1fr_140px_140px] gap-3 border-b border-line bg-surface px-4 py-2.5 text-[11.5px] font-bold text-ink-muted">
          <span>{t('students.cols.student')}</span>
          <span>{t('students.cols.email')}</span>
          <span>{t('students.cols.course')}</span>
          <span>{t('students.cols.enrolled')}</span>
          <span>{t('students.cols.progress')}</span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-ink-muted">{t('common.loading')}</div>}
        {!isLoading && (!students || students.length === 0) && (
          <div className="p-10 text-center text-sm text-ink-muted">{t('students.empty')}</div>
        )}

        {students?.map((s, idx) => (
          <div
            key={idx}
            className={`grid min-w-[680px] grid-cols-[1.4fr_1.4fr_1fr_140px_140px] items-center gap-3 px-4 py-2.5 text-[13px] ${
              idx < students.length - 1 ? 'border-b border-line-soft' : ''
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
      </div>
    </>
  );
}

function StatCard({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <span className="text-[11.5px] font-semibold text-ink-muted">{label}</span>
      <div className={`mt-1 font-display text-[22px] font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
