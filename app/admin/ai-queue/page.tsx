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

interface JobSummary {
  pending: number;
  processing: number;
  completed: number;
  needsAttention: number;
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

  // Bốn thẻ số liệu lấy từ chính danh sách job lồng tiếng trong cơ sở dữ liệu (cùng nguồn với bảng bên dưới) — không dùng bộ nhớ tạm của AI Worker vì nó đếm cả task khác và tự hết hạn.
  const { data: stats, refetch } = useQuery({
    queryKey: ['admin', 'dubbing-job-summary'],
    queryFn: () => api.get<JobSummary>('/api/v1/admin/dubbing-jobs/summary', { token }),
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
        <MetricCard label={t('stats.pending')} value={String(stats?.pending ?? 0)} />
        <MetricCard label={t('stats.started')} value={String(stats?.processing ?? 0)} />
        <MetricCard label={t('stats.success')} value={String(stats?.completed ?? 0)} />
        <MetricCard label={t('stats.failure')} value={String(stats?.needsAttention ?? 0)} tone={(stats?.needsAttention ?? 0) > 0 ? 'warning' : 'default'} />
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
