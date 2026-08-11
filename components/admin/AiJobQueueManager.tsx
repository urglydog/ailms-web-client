'use client';

import { useState } from 'react';
import { useAiJobs, useRetryAiJob } from '@/hooks/useAiJobs';
import { ApiError } from '@/lib/api/client';
import type { JobStatus } from '@/types/domain';

/**
 * UC45 — Admin giám sát hàng đợi lồng tiếng AI: danh sách job lọc theo trạng thái, thử lại
 * job `FAILED` (BR-CHUNK-04: tối đa 3 lần, `SKIPPED` không bao giờ cho retry — BR-DUB-10).
 */
const STATUS_OPTIONS: { value: JobStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'FAILED', label: 'Lỗi' },
  { value: 'SKIPPED', label: 'Bỏ qua' },
];

export function AiJobQueueManager() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const { data, isLoading } = useAiJobs(statusFilter === 'ALL' ? undefined : statusFilter);
  const retryJob = useRetryAiJob();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetry = (id: number) => {
    if (!window.confirm(`Thử lại job lồng tiếng #${id}?`)) return;
    setErrorMessage(null);
    retryJob.mutate(id, {
      onError: (err) =>
        setErrorMessage(err instanceof ApiError ? err.message : 'Không thử lại được job này.'),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'ALL')}
        className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{errorMessage}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Bài học</th>
              <th className="px-6 py-4">Ngôn ngữ</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Tiến độ</th>
              <th className="px-6 py-4">Retry</th>
              <th className="px-6 py-4">Lỗi</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                  Không có job nào.
                </td>
              </tr>
            )}
            {data?.content.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">
                  {job.lessonTitle}
                  <span className="ml-1 font-normal text-gray-400">#{job.lessonId}</span>
                </td>
                <td className="px-6 py-3 text-gray-600">{job.targetLanguage}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      job.status === 'FAILED'
                        ? 'bg-red-100 text-red-700'
                        : job.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'SKIPPED'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-cyan-100 text-cyan-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {job.doneChunks}/{job.totalChunks} ({job.progressPercent}%)
                </td>
                <td className="px-6 py-3 text-gray-600">{job.retryCount}/3</td>
                <td className="px-6 py-3 max-w-xs truncate text-gray-500" title={job.errorMessage ?? ''}>
                  {job.errorMessage ?? '—'}
                </td>
                <td className="px-6 py-3 text-right">
                  {job.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      disabled={retryJob.isPending}
                      className="text-xs font-bold text-cyan-600 hover:text-cyan-800 disabled:opacity-50"
                    >
                      Thử lại
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
