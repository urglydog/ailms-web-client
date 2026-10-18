'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, DollarSign, ShieldCheck, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PendingCourses } from '@/components/admin/overview/PendingCourses';
import { SystemHealth, type SystemMetrics } from '@/components/admin/overview/SystemHealth';
import { MetricCard } from '@/components/instructor/performance/MetricCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { formatMoney } from '@/lib/shop/money';
import { useModerationQueue } from '@/hooks/useCourses';

interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
}

const QUICK_LINKS = [
  { id: 'moderation', href: '/admin/moderation', icon: ShieldCheck },
  { id: 'users', href: '/admin/users', icon: Users },
  { id: 'transactions', href: '/admin/transactions/payments', icon: DollarSign },
  { id: 'aiqueue', href: '/admin/ai-queue', icon: Activity },
] as const;

/** Tổng quan Quản trị: 4 chỉ số, hàng đợi duyệt khóa, lối tắt tới việc hay làm và tình trạng máy chủ. Token chỉ có ở máy khách nên
 * chờ mount mới truy vấn (tránh lệch HTML giữa máy chủ và máy khách). */
export default function AdminOverviewPage() {
  const t = useTranslations('admin.overview');
  const tNav = useTranslations('admin.nav');
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const enabled = mounted && !!getAccessToken();

  const { data } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboardData>('/api/v1/dashboard/admin', { token: getAccessToken() ?? undefined }),
    enabled,
  });

  const { data: systemMetrics, refetch: refetchSystem } = useQuery({
    queryKey: ['dashboard', 'system'],
    queryFn: () => api.get<SystemMetrics>('/api/v1/dashboard/admin/system', { token: getAccessToken() ?? undefined }),
    enabled,
    refetchInterval: 10000, // Tự động làm mới mỗi 10 giây
  });

  const { data: pendingPage } = useModerationQueue({ status: 'PENDING', size: 5 });

  const pendingCount = data?.pendingCourses ?? 0;
  const dash = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString(locale));

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <MetricCard label={t('kpi.pending')} value={dash(data?.pendingCourses)} tone={pendingCount > 0 ? 'warning' : 'default'} />
        <MetricCard label={t('kpi.users')} value={dash(data?.totalUsers)} />
        <MetricCard label={t('kpi.courses')} value={dash(data?.totalCourses)} />
        <MetricCard label={t('kpi.revenue')} value={data ? formatMoney(data.totalRevenue, locale) : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PendingCourses courses={pendingPage?.content ?? []} total={pendingPage?.totalElements ?? pendingCount} />
          <section aria-labelledby="quick-title">
            <h2 id="quick-title" className="m-0 mb-2.5 font-display text-[15px] font-bold text-ink">
              {t('quick.title')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_LINKS.map(({ id, href, icon: Icon }) => (
                <Link
                  key={id}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-ink no-underline shadow-sm transition-colors hover:border-accent hover:text-ink"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent-dark">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold">{tNav(id)}</span>
                    <span className="block truncate text-xs text-ink-muted">{t(`quick.${id}`)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <SystemHealth metrics={systemMetrics} onRefresh={() => void refetchSystem()} />
      </div>
    </>
  );
}
