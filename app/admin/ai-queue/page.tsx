'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AiJobQueueManager } from '@/components/admin/AiJobQueueManager';

interface QueueStats {
  queues: Record<string, { pending: number }>;
  task_stats: { SUCCESS: number; FAILURE: number; PENDING: number; STARTED: number };
  total_result_keys: number;
  key_pool: { key_preview: string; status: string; in_cooldown: boolean; failures: number }[];
  error?: string;
}

interface HealthData {
  status: string;
  service: string;
  asr_backend: string;
  gemini_model: string;
  chunk_minutes: number;
}

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL || 'http://localhost:8002';

async function fetchQueueStats(): Promise<QueueStats> {
  const res = await fetch(`${AI_WORKER_URL}/admin/queue-stats`, {
    headers: {
      'x-internal-token': 'dev-internal-token',
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function fetchAiHealth(): Promise<HealthData> {
  const res = await fetch(`${AI_WORKER_URL}/health`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`font-display text-[26px] font-extrabold ${color}`}>{value}</span>
    </div>
  );
}

export default function AiQueuePage() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'queue-stats'],
    queryFn: fetchQueueStats,
    refetchInterval: 8000,
  });

  const { data: health } = useQuery({
    queryKey: ['admin', 'ai-health'],
    queryFn: fetchAiHealth,
    refetchInterval: 15000,
  });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const totalPending = Object.values(stats?.queues ?? {}).reduce((s, q) => s + q.pending, 0);
  const taskStats = stats?.task_stats ?? { SUCCESS: 0, FAILURE: 0, PENDING: 0, STARTED: 0 };

  if (!isMounted) return null;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Giám sát AI Queue</h1>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            health?.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            <span className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            AI Worker: {health?.status === 'ok' ? 'Hoạt động' : 'Lỗi'}
          </span>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard label="Đang chờ trong Queue" value={totalPending} color="text-yellow-600" />
        <StatCard label="Đang xử lý" value={taskStats.STARTED} color="text-blue-600" />
        <StatCard label="Hoàn thành" value={taskStats.SUCCESS} color="text-green-600" />
        <StatCard label="Thất bại" value={taskStats.FAILURE} color="text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Queue Details */}
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[15px] font-bold text-gray-900">Chi tiết Queue</span>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {isLoading && (
              <div className="flex h-32 items-center justify-center text-sm text-gray-400">Đang tải...</div>
            )}
            {isError && (
              <div className="flex h-32 items-center justify-center text-sm text-red-500">
                Không thể kết nối AI Worker tại <code className="ml-1 font-mono">{AI_WORKER_URL}</code>
              </div>
            )}
            {stats && Object.keys(stats.queues).length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                Queue trống — không có task đang chờ.
              </div>
            )}
            {stats && Object.entries(stats.queues).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 font-mono">{name}</span>
                  <span className="text-xs text-gray-400">Celery default queue</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  info.pending > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {info.pending} task đang chờ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini Key Pool */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-[15px] font-bold text-gray-900">Gemini Key Pool (Slot)</span>
            <span className="text-xs text-gray-400">{stats?.key_pool?.length ?? 0} slot ({stats?.key_pool?.filter(k => !k.in_cooldown).length ?? 0} active)</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {(!stats?.key_pool || stats.key_pool.length === 0) && (
              <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                Chưa có key nào được cấu hình.
              </div>
            )}
            {stats?.key_pool?.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
                <div className="flex flex-col flex-1 gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-gray-700">{slot.key_preview}</span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-600">{'model' in slot ? (slot as { model: string }).model : ''}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{(slot.failures ?? 0)} lỗi liên tiếp{(slot as { cooldown_remaining_sec?: number }).cooldown_remaining_sec ? ` · hồi phục sau ${(slot as { cooldown_remaining_sec?: number }).cooldown_remaining_sec}s` : ''}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
                  slot.in_cooldown
                    ? 'bg-orange-100 text-orange-700'
                    : slot.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {slot.in_cooldown ? '⏸ Cooldown' : slot.status === 'ACTIVE' ? '✓ Active' : slot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduled Jobs */}
      <div className="flex flex-col gap-2.5">
        <span className="font-display text-[15px] font-bold text-gray-900">Celery Beat — Lịch Job định kỳ</span>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {[
            { name: 'cleanup-temp-files', desc: 'Dọn file trung gian (.wav, chunk video) > 24h', schedule: 'Mỗi tiếng (phút :00)', status: 'active', rule: 'BR-STORAGE-01' },
            { name: 'cleanup-old-notifications', desc: 'Xóa thông báo đã đọc > 90 ngày', schedule: '3:00 AM hàng ngày', status: 'pending', rule: 'BR-NOTIFY-01' },
            { name: 'remind-flashcard-reviews', desc: 'Nhắc lịch ôn Flashcards (SM-2)', schedule: '7:00 AM hàng ngày', status: 'pending', rule: 'BR-CARD-01' },
            { name: 'report-unused-audio', desc: 'Báo cáo audio không dùng > 180 ngày', schedule: 'Thứ 2 hàng tuần 4:00 AM', status: 'pending', rule: 'BR-DUB-08' },
          ].map((job, idx, arr) => (
            <div key={job.name} className={`flex items-center gap-4 px-5 py-3.5 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex flex-col flex-1 gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-gray-800">{job.name}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">{job.rule}</span>
                </div>
                <span className="text-xs text-gray-500">{job.desc}</span>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{job.schedule}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
                job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {job.status === 'active' ? '✓ Đang chạy' : '○ Chờ triển khai'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-display text-[15px] font-bold text-gray-900">Danh sách Job lồng tiếng</span>
        <AiJobQueueManager />
      </div>
    </>
  );
}
