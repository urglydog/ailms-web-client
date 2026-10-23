'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { SystemMetrics } from '@/components/admin/overview/SystemHealth';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { api, ApiError } from '@/lib/api/client';
import { formatBytes, formatUptime, usagePercent, usageTone } from '@/lib/admin/overview';
import { getAccessToken } from '@/lib/auth/token';

interface HealthData {
  status: string;
  service: string;
  asr_backend: string;
  gemini_model: string;
  chunk_minutes: number;
}

interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
}

interface ConfigRes {
  key: string;
  value: string;
  description: string | null;
}

/** Map configKey BE <-> id dùng cho label i18n `admin.settings.quotas.<id>`. */
const QUOTA_KEY_TO_ID: Record<string, string> = {
  QUOTA_DUB_STUDENT: 'dubStudent',
  QUOTA_DUB_INSTRUCTOR: 'dubInstructor',
  QUOTA_MATERIALS: 'materials',
  QUOTA_TUTOR: 'tutor',
  QUOTA_GUEST_SEARCH: 'guestSearch',
};

const ENVIRONMENT = [
  { key: 'Service', val: 'Spring Boot 3 + Next.js 15' },
  { key: 'Database', val: 'MySQL 8.0' },
  { key: 'Cache/Queue', val: 'Redis 7' },
  { key: 'AI Runtime', val: 'FastAPI + Celery' },
  { key: 'Profile', val: 'dev' },
] as const;

const BAR_COLOR = { ok: 'bg-success', warn: 'bg-warning', critical: 'bg-danger' } as const;

function ConfigRow({ label, value, description, badge }: { label: string; value: string | number; description?: string; badge?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-4 last:border-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-ink">{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-accent-dark">{badge}</span>}
        <code className="break-all rounded bg-surface px-2.5 py-1 font-mono text-[12.5px] text-ink">{value}</code>
      </div>
    </div>
  );
}

function Meter({ label, used, total, warnAt, criticalAt }: { label: string; used: number; total: number; warnAt: number; criticalAt: number }) {
  const percent = usagePercent(used, total);
  const tone = usageTone(used, total, warnAt, criticalAt);
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-2 text-xs">
        <span className="font-medium text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">{total > 0 ? `${formatBytes(used)} / ${formatBytes(total)} (${percent}%)` : '—'}</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} data-tone={tone} className="h-2 w-full overflow-hidden rounded-full bg-tint">
        <div className={`h-full rounded-full transition-all ${BAR_COLOR[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Cấu hình hệ thống: AI Worker (chỉ xem, dữ liệu sống), hạn ngạch nghiệp vụ (sửa được, lưu
 * thật qua DB — xem {@code SystemConfigController}), tài nguyên Backend và môi trường chạy. */
export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const token = mounted ? (getAccessToken() ?? '') : '';
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  const { data: aiHealth, isError: aiError } = useQuery({
    queryKey: ['settings', 'ai-health'],
    queryFn: () => api.get<HealthData>('/api/v1/admin/ai-worker/health', { token }),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: quotas, isLoading: quotasLoading } = useQuery({
    queryKey: ['settings', 'system-config'],
    queryFn: () => api.get<ConfigRes[]>('/api/v1/admin/system-config', { token }),
    enabled: !!token,
  });

  const saveQuotas = useMutation({
    mutationFn: (values: Record<string, string>) =>
      api.put<ConfigRes[]>('/api/v1/admin/system-config', { values }, { token }),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'system-config'], data);
      setDraft(null);
      toast.success(t('quotas.saved'));
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('quotas.saveError')),
  });

  const values = draft ?? Object.fromEntries((quotas ?? []).map((q) => [q.key, q.value]));
  const isDirty = draft !== null;

  const { data: systemMetrics } = useQuery({
    queryKey: ['settings', 'system'],
    queryFn: () => api.get<SystemMetrics>('/api/v1/dashboard/admin/system', { token }),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: dashStats } = useQuery({
    queryKey: ['settings', 'dashboard'],
    queryFn: () => api.get<AdminDashboardData>('/api/v1/dashboard/admin', { token }),
    enabled: !!token,
  });

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-2.5 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('worker.title')}</h2>
            <span
              role="status"
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                aiError ? 'border border-danger/40 bg-white text-danger' : 'bg-success-tint text-success-ink'
              }`}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${aiError ? 'bg-danger' : 'bg-success'}`} />
              {aiError ? t('worker.down') : t('worker.up')}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <ConfigRow label={t('worker.gemini')} value={aiHealth?.gemini_model ?? '—'} description={t('worker.geminiDesc')} badge="Live" />
            <ConfigRow label={t('worker.asr')} value={aiHealth?.asr_backend ?? '—'} description={t('worker.asrDesc')} />
            <ConfigRow label={t('worker.chunk')} value={aiHealth ? t('worker.minutes', { count: aiHealth.chunk_minutes }) : '—'} description={t('worker.chunkDesc')} />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('quotas.title')}</h2>
            {isDirty && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-tint"
                >
                  {t('quotas.cancel')}
                </button>
                <button
                  type="button"
                  disabled={saveQuotas.isPending}
                  onClick={() => draft && saveQuotas.mutate(draft)}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {saveQuotas.isPending ? t('quotas.saving') : t('quotas.save')}
                </button>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {quotasLoading && <div className="px-5 py-4 text-sm text-ink-muted">{t('quotas.loading')}</div>}
            {(quotas ?? []).map((item) => {
              const id = QUOTA_KEY_TO_ID[item.key] ?? item.key;
              return (
                <div key={item.key} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-3.5 last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-ink">{QUOTA_KEY_TO_ID[item.key] ? t(`quotas.${id}`) : item.description}</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">{item.key}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={values[item.key] ?? ''}
                    onChange={(e) => setDraft({ ...values, [item.key]: e.target.value })}
                    className="w-24 rounded border border-line bg-surface px-2.5 py-1 text-right font-mono text-[12.5px] text-ink outline-none focus:border-accent"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('resources.title')}</h2>
          <div className="flex flex-col gap-5 rounded-xl border border-line bg-white p-5 shadow-sm">
            <Meter label={t('resources.ram')} used={systemMetrics?.ram.used ?? 0} total={systemMetrics?.ram.total ?? 0} warnAt={0.7} criticalAt={0.8} />
            <Meter label={t('resources.disk')} used={systemMetrics?.disk.used ?? 0} total={systemMetrics?.disk.total ?? 0} warnAt={0.8} criticalAt={0.9} />
            <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">{t('resources.uptime')}</span>
                <span className="font-semibold text-ink">{systemMetrics ? formatUptime(systemMetrics.uptime) : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">{t('resources.courses')}</span>
                <span className="font-semibold text-ink">{dashStats?.totalCourses ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">{t('resources.users')}</span>
                <span className="font-semibold text-ink">{dashStats?.totalUsers ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{t('env.title')}</span>
            {ENVIRONMENT.map(({ key, val }) => (
              <div key={key} className="flex justify-between gap-3">
                <span className="text-xs text-ink-muted">{key}</span>
                <code className="text-right font-mono text-[11.5px] text-ink">{val}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
