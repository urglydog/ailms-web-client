'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AiJobQueueManager } from '@/components/admin/AiJobQueueManager';
import { MetricCard } from '@/components/instructor/performance/MetricCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

interface QueueStats {
  queues: Record<string, { pending: number }>;
  task_stats: { SUCCESS: number; FAILURE: number; PENDING: number; STARTED: number };
  total_result_keys: number;
  key_pool: { key_preview: string; status: string; in_cooldown: boolean; failures: number; model?: string; cooldown_remaining_sec?: number }[];
  error?: string;
}

interface HealthData {
  status: string;
  service: string;
  asr_backend: string;
  gemini_model: string;
  chunk_minutes: number;
}

/** Lịch Celery Beat: tên job, mã quy tắc nghiệp vụ và trạng thái triển khai; mô tả/lịch chạy lấy từ `admin.queue.beat.<id>`. */
const BEAT_JOBS = [
  { id: 'cleanupTemp', name: 'cleanup-temp-files', rule: 'BR-STORAGE-01', active: true },
  { id: 'cleanupNotifications', name: 'cleanup-old-notifications', rule: 'BR-NOTIFY-01', active: false },
  { id: 'remindFlashcards', name: 'remind-flashcard-reviews', rule: 'BR-CARD-01', active: false },
  { id: 'reportAudio', name: 'report-unused-audio', rule: 'BR-DUB-08', active: false },
] as const;

/** Giám sát hàng đợi AI: sức khỏe AI Worker, số task theo trạng thái, hàng đợi, nhóm khóa Gemini, lịch Celery Beat, danh sách job. */
export default function AiQueuePage() {
  const t = useTranslations('admin.queue');
  const token = getAccessToken() ?? '';

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'queue-stats'],
    queryFn: () => api.get<QueueStats>('/api/v1/admin/ai-worker/queue-stats', { token }),
    enabled: !!token,
    refetchInterval: 8000,
  });

  const { data: health } = useQuery({
    queryKey: ['admin', 'ai-health'],
    queryFn: () => api.get<HealthData>('/api/v1/admin/ai-worker/health', { token }),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const totalPending = Object.values(stats?.queues ?? {}).reduce((s, q) => s + q.pending, 0);
  const taskStats = stats?.task_stats ?? { SUCCESS: 0, FAILURE: 0, PENDING: 0, STARTED: 0 };
  const healthy = health?.status === 'ok';

  if (!isMounted) return null;

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div className="flex items-center gap-3">
            <span
              role="status"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                healthy ? 'bg-success-tint text-success-ink' : 'border border-danger/40 bg-white text-danger'
              }`}
            >
              <span aria-hidden className={`h-2 w-2 rounded-full ${healthy ? 'bg-success' : 'bg-danger'}`} />
              {t('worker', { status: healthy ? t('ok') : t('down') })}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-tint px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-line"
            >
              <RefreshCw size={13} aria-hidden />
              {t('refresh')}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <MetricCard label={t('stats.pending')} value={String(totalPending)} />
        <MetricCard label={t('stats.started')} value={String(taskStats.STARTED)} />
        <MetricCard label={t('stats.success')} value={String(taskStats.SUCCESS)} />
        <MetricCard label={t('stats.failure')} value={String(taskStats.FAILURE)} tone={taskStats.FAILURE > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-2.5" aria-labelledby="queue-detail">
          <h2 id="queue-detail" className="m-0 font-display text-[15px] font-bold text-ink">
            {t('queueDetail')}
          </h2>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {isLoading && <div className="flex h-32 items-center justify-center text-sm text-ink-muted">{t('loading')}</div>}
            {isError && (
              <div role="alert" className="flex h-32 items-center justify-center px-4 text-center text-sm text-danger">
                {t('connectError')}
              </div>
            )}
            {stats && Object.keys(stats.queues).length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-ink-muted">{t('queueEmpty')}</div>
            )}
            {stats &&
              Object.entries(stats.queues).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5 last:border-0">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-sm font-semibold text-ink">{name}</span>
                    <span className="text-xs text-ink-muted">{t('defaultQueue')}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      info.pending > 0 ? 'border border-warning bg-white text-ink' : 'bg-success-tint text-success-ink'
                    }`}
                  >
                    {t('pendingTasks', { count: info.pending })}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5" aria-labelledby="key-pool">
          <div className="flex items-center justify-between gap-3">
            <h2 id="key-pool" className="m-0 font-display text-[15px] font-bold text-ink">
              {t('keyPool')}
            </h2>
            <span className="text-xs text-ink-muted">
              {t('slots', { total: stats?.key_pool?.length ?? 0, active: stats?.key_pool?.filter((k) => !k.in_cooldown).length ?? 0 })}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {(!stats?.key_pool || stats.key_pool.length === 0) && (
              <div className="flex h-32 items-center justify-center text-sm text-ink-muted">{t('noKeys')}</div>
            )}
            {stats?.key_pool?.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 border-b border-line-soft px-5 py-3 last:border-0">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-ink">{slot.key_preview}</span>
                    {slot.model && <span className="rounded bg-tint px-1.5 py-0.5 font-mono text-[10px] text-accent-dark">{slot.model}</span>}
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {t('failures', { count: slot.failures ?? 0 })}
                    {slot.cooldown_remaining_sec ? ` · ${t('recoverIn', { sec: slot.cooldown_remaining_sec })}` : ''}
                  </span>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    slot.in_cooldown
                      ? 'border border-warning bg-white text-ink'
                      : slot.status === 'ACTIVE'
                        ? 'bg-success-tint text-success-ink'
                        : 'bg-line-soft text-ink-muted'
                  }`}
                >
                  {slot.in_cooldown ? t('slot.cooldown') : slot.status === 'ACTIVE' ? t('slot.active') : slot.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-2.5" aria-labelledby="beat-title">
        <h2 id="beat-title" className="m-0 font-display text-[15px] font-bold text-ink">
          {t('beat.title')}
        </h2>
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          {BEAT_JOBS.map((job) => (
            <div key={job.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-3.5 last:border-0">
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-ink">{job.name}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">{job.rule}</span>
                </div>
                <span className="text-xs text-ink-muted">{t(`beat.${job.id}.desc`)}</span>
              </div>
              <span className="whitespace-nowrap text-xs text-ink-muted">{t(`beat.${job.id}.schedule`)}</span>
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  job.active ? 'bg-success-tint text-success-ink' : 'bg-line-soft text-ink-muted'
                }`}
              >
                {job.active ? t('beat.running') : t('beat.planned')}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5" aria-labelledby="jobs-title">
        <h2 id="jobs-title" className="m-0 font-display text-[15px] font-bold text-ink">
          {t('jobs')}
        </h2>
        <AiJobQueueManager />
      </section>
    </>
  );
}
