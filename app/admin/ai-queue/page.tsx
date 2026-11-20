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

/** Giám sát hàng đợi AI: sức khỏe AI Worker, số task theo trạng thái và danh sách job (tìm kiếm, lọc, phân trang). Không hiện chi tiết hàng đợi nội bộ, nhóm khóa hay lịch job tĩnh. */
export default function AiQueuePage() {
  const t = useTranslations('admin.queue');
  const token = getAccessToken() ?? '';

  const { data: stats, refetch } = useQuery({
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
                healthy ? 'bg-success-tint text-success-ink' : 'border border-danger/40 bg-surface-raised text-danger'
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

      <section className="flex flex-col gap-2.5" aria-labelledby="jobs-title">
        <h2 id="jobs-title" className="m-0 font-display text-[15px] font-bold text-ink">
          {t('jobs')}
        </h2>
        <AiJobQueueManager />
      </section>
    </>
  );
}
