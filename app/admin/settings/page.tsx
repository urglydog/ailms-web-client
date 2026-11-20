'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { SystemMetrics } from '@/components/admin/overview/SystemHealth';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { api, ApiError } from '@/lib/api/client';
import { SETTING_GROUPS, validateSetting, type SettingItem } from '@/lib/admin/settingsSchema';
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
        <div className={`h-full rounded-full transition-[width] duration-300 ease-soft ${BAR_COLOR[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}


/** Công tắc bật/tắt cho giá trị 1/0. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line-dot'}`}
    >
      <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const inputBase = 'rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent';

/**
 * Cấu hình hệ thống (20/11/2026): menu nhóm chức năng bên trái, giá trị của nhóm đang chọn bên phải. Công tắc cho giá trị bật/tắt, ô số có đơn vị,
 * danh sách email; không hiện tên biến kỹ thuật. Thanh Lưu dán cố định ở đáy màn hình khi có thay đổi. Giá trị lưu thật qua DB (xem SystemConfigController).
 */
export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const token = mounted ? (getAccessToken() ?? '') : '';
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [groupId, setGroupId] = useState<string>(SETTING_GROUPS[0]!.id);

  const { data: aiHealth, isError: aiError } = useQuery({
    queryKey: ['settings', 'ai-health'],
    queryFn: () => api.get<HealthData>('/api/v1/admin/ai-worker/health', { token }),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['settings', 'system-config'],
    queryFn: () => api.get<ConfigRes[]>('/api/v1/admin/system-config', { token }),
    enabled: !!token,
  });

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

  const saved = useMemo(() => Object.fromEntries((configs ?? []).map((c) => [c.key, c.value])), [configs]);
  const valueOf = (key: string) => draft[key] ?? saved[key] ?? '';
  const allItems = useMemo(() => SETTING_GROUPS.flatMap((g) => g.items), []);
  const dirtyKeys = Object.keys(draft).filter((k) => draft[k] !== saved[k]);
  const errors = Object.fromEntries(
    dirtyKeys.map((k) => [k, validateSetting(allItems.find((i) => i.key === k)!, draft[k] ?? '')] as const).filter(([, e]) => e !== null),
  ) as Record<string, string>;
  const hasErrors = Object.keys(errors).length > 0;
  const dirtyInGroup = (g: (typeof SETTING_GROUPS)[number]) => g.items.some((i) => dirtyKeys.includes(i.key));

  const save = useMutation({
    mutationFn: (values: Record<string, string>) => api.put<ConfigRes[]>('/api/v1/admin/system-config', { values }, { token }),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'system-config'], data);
      setDraft({});
      toast.success(t('quotas.saved'));
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('quotas.saveError')),
  });

  // Cảnh báo khi rời trang lúc còn thay đổi chưa lưu.
  useEffect(() => {
    if (dirtyKeys.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyKeys.length]);

  const setValue = (key: string, v: string) => setDraft((d) => ({ ...d, [key]: v }));
  const group = SETTING_GROUPS.find((g) => g.id === groupId);
  const isSystem = groupId === 'system';

  const control = (item: SettingItem) => {
    const v = valueOf(item.key);
    const err = errors[item.key];
    if (item.kind === 'switch') return <Switch checked={v === '1'} onChange={(on) => setValue(item.key, on ? '1' : '0')} label={item.label} />;
    if (item.kind === 'number') {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={item.min}
            max={item.max}
            aria-label={item.label}
            aria-invalid={!!err}
            value={v}
            onChange={(e) => setValue(item.key, e.target.value)}
            className={`${inputBase} w-32 text-right ${err ? 'border-danger' : 'border-line'}`}
          />
          {item.unit && <span className="text-xs text-ink-muted">{item.unit}</span>}
        </div>
      );
    }
    return (
      <input
        type="text"
        aria-label={item.label}
        aria-invalid={!!err}
        placeholder={item.placeholder}
        value={v}
        onChange={(e) => setValue(item.key, e.target.value)}
        className={`${inputBase} w-full sm:w-80 ${err ? 'border-danger' : 'border-line'}`}
      />
    );
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Nhóm cấu hình" className="flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-surface-raised p-2 shadow-sm lg:flex-col lg:overflow-visible">
          {[...SETTING_GROUPS.map((g) => ({ id: g.id, title: g.title, dirty: dirtyInGroup(g) })), { id: 'system', title: 'Máy chủ & môi trường', dirty: false }].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              aria-current={groupId === g.id ? 'page' : undefined}
              className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                groupId === g.id ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-surface'
              }`}
            >
              {g.title}
              {g.dirty && <span aria-label="Có thay đổi chưa lưu" className="h-2 w-2 shrink-0 rounded-full bg-warning" />}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {isSystem ? (
            <>
              <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
                <h2 className="m-0 font-display text-base font-bold text-ink">{t('resources.title')}</h2>
                <Meter label={t('resources.ram')} used={systemMetrics?.ram.used ?? 0} total={systemMetrics?.ram.total ?? 0} warnAt={0.7} criticalAt={0.8} />
                <Meter label={t('resources.disk')} used={systemMetrics?.disk.used ?? 0} total={systemMetrics?.disk.total ?? 0} warnAt={0.8} criticalAt={0.9} />
                <div className="flex flex-col gap-2 border-t border-line-soft pt-3 text-sm">
                  <div className="flex justify-between"><span className="text-ink-muted">{t('resources.uptime')}</span><span className="font-semibold text-ink">{systemMetrics ? formatUptime(systemMetrics.uptime) : 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-ink-muted">{t('resources.courses')}</span><span className="font-semibold text-ink">{dashStats?.totalCourses ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-ink-muted">{t('resources.users')}</span><span className="font-semibold text-ink">{dashStats?.totalUsers ?? '—'}</span></div>
                </div>
              </section>
              <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
                <h2 className="m-0 font-display text-base font-bold text-ink">{t('env.title')}</h2>
                {ENVIRONMENT.map(({ key, val }) => (
                  <div key={key} className="flex justify-between gap-3 text-sm">
                    <span className="text-ink-muted">{key}</span>
                    <span className="text-right font-semibold text-ink">{val}</span>
                  </div>
                ))}
              </section>
            </>
          ) : group ? (
            <>
              {group.id === 'ai' && (
                <section className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-3.5">
                    <h2 className="m-0 font-display text-base font-bold text-ink">{t('worker.title')}</h2>
                    <span
                      role="status"
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${aiError ? 'border border-danger/40 bg-surface-raised text-danger' : 'bg-success-tint text-success-ink'}`}
                    >
                      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${aiError ? 'bg-danger' : 'bg-success'}`} />
                      {aiError ? t('worker.down') : t('worker.up')}
                    </span>
                  </div>
                  <ConfigRow label={t('worker.gemini')} value={aiHealth?.gemini_model ?? '—'} description={t('worker.geminiDesc')} badge="Live" />
                  <ConfigRow label={t('worker.asr')} value={aiHealth?.asr_backend ?? '—'} description={t('worker.asrDesc')} />
                  <ConfigRow label={t('worker.chunk')} value={aiHealth ? t('worker.minutes', { count: aiHealth.chunk_minutes }) : '—'} description={t('worker.chunkDesc')} />
                </section>
              )}
              <section className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
                <div className="border-b border-line-soft px-5 py-4">
                  <h2 className="m-0 font-display text-base font-bold text-ink">{group.title}</h2>
                  <p className="m-0 mt-1 text-sm text-ink-muted">{group.description}</p>
                </div>
                {configsLoading && <div className="px-5 py-4 text-sm text-ink-muted">{t('quotas.loading')}</div>}
                {group.items
                  .filter((item) => item.key in saved)
                  .map((item) => (
                    <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4 last:border-0">
                      <div className="flex min-w-0 max-w-xl flex-col gap-0.5">
                        <span className="text-[13.5px] font-semibold text-ink">{item.label}</span>
                        {item.help && <span className="text-xs text-ink-muted">{item.help}</span>}
                        {errors[item.key] && <span role="alert" className="text-xs font-semibold text-danger">{errors[item.key]}</span>}
                      </div>
                      {control(item)}
                    </div>
                  ))}
              </section>
            </>
          ) : null}
        </div>
      </div>

      {dirtyKeys.length > 0 && (
        <div role="region" aria-label="Lưu thay đổi" className="sticky bottom-4 z-20 mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised px-5 py-3 shadow-card-hover">
          <span className="text-sm font-semibold text-ink">
            Có {dirtyKeys.length} thay đổi chưa lưu{hasErrors ? ' — vui lòng sửa các giá trị chưa hợp lệ' : ''}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDraft({})} className="rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
              {t('quotas.cancel')}
            </button>
            <button
              type="button"
              disabled={save.isPending || hasErrors}
              onClick={() => save.mutate(Object.fromEntries(dirtyKeys.map((k) => [k, (draft[k] ?? '').trim()])))}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {save.isPending ? t('quotas.saving') : t('quotas.save')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
