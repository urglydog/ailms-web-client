'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { ListSearch } from '@/components/ui/ListSearch';
import { Pager } from '@/components/ui/SearchPanel';
import { useAiJobs, useRetryAiJob } from '@/hooks/useAiJobs';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError } from '@/lib/api/client';
import { dateTime } from '@/lib/finance';
import type { AiJobSummary, JobStatus } from '@/types/domain';

/** Bộ lọc xem: "Cần xử lý" = job lỗi mà bài học + ngôn ngữ đó CHƯA có bản lồng tiếng thành công (job lỗi cũ đã được bản sau thay thế không hiện). */
type View = 'ATTENTION' | 'ALL' | JobStatus;
const VIEW_LABEL: Record<string, string> = {
  ATTENTION: 'Cần xử lý (lỗi, chưa có bản thành công)',
  PROCESSING: 'Đang xử lý',
  PENDING: 'Đang chờ',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Tất cả job lỗi',
  SKIPPED: 'Đã bỏ qua',
  ALL: 'Tất cả',
};
const VIEWS: View[] = ['ATTENTION', 'PROCESSING', 'PENDING', 'COMPLETED', 'FAILED', 'SKIPPED', 'ALL'];

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Lỗi',
  SKIPPED: 'Đã bỏ qua',
  CANCELLED: 'Đã hủy',
};

/**
 * Giám sát job lồng tiếng (UC45, chỉnh 21/11/2026): mặc định chỉ hiện job CẦN XỬ LÝ; mỗi dòng nêu rõ khóa học, bài học, người yêu cầu và thời gian. Job lỗi cũ mà bài học + ngôn ngữ
 * đó đã có bản thành công được ghi "Đã có bản thành công" và KHÔNG có nút Thử lại (thử lại sẽ tốn chi phí AI vô ích). Nút Thử lại luôn hỏi xác nhận kèm cảnh báo chi phí.
 */
export function AiJobQueueManager() {
  const [view, setView] = useState<View>('ATTENTION');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState<AiJobSummary | null>(null);

  const { data, isLoading } = useAiJobs({
    view: view === 'ATTENTION' ? 'ATTENTION' : undefined,
    status: view === 'ATTENTION' || view === 'ALL' ? undefined : view,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
  });
  const retryJob = useRetryAiJob();
  const input = 'rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent';
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  const doRetry = () => {
    if (!confirming) return;
    retryJob.mutate(confirming.id, {
      onSuccess: () => toast.success('Đã đưa job vào hàng đợi để lồng tiếng lại.'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Không thử lại được job. Vui lòng thử lại sau.'),
    });
    setConfirming(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Xem</span>
          <select aria-label="Chế độ xem" value={view} onChange={(e) => reset(() => setView(e.target.value as View))} className={`${input} w-72`}>
            {VIEWS.map((v) => (
              <option key={v} value={v}>{VIEW_LABEL[v]}</option>
            ))}
          </select>
        </label>
        <ListSearch label="Tìm job" value={search} onChange={(v) => reset(() => setSearch(v))} placeholder="Khóa học, bài học, ngôn ngữ, người yêu cầu hoặc mã job..." className="sm:w-80" />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Từ ngày</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => reset(() => setFrom(e.target.value))} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">Đến ngày</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => reset(() => setTo(e.target.value))} className={input} />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3">Khóa học / Bài học</th>
              <th className="px-4 py-3">Ngôn ngữ</th>
              <th className="px-4 py-3">Người yêu cầu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Lỗi</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && !data && (
              <tr><td colSpan={8} className="px-6 py-6 text-center text-ink-muted">Đang tải...</td></tr>
            )}
            {data && data.content.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-muted">
                  {view === 'ATTENTION' ? 'Không có job nào cần xử lý.' : 'Không có job nào khớp bộ lọc.'}
                </td>
              </tr>
            )}
            {data?.content.map((job) => (
              <tr key={job.id} className="align-top hover:bg-surface">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{job.courseTitle}</div>
                  <div className="text-xs text-ink-muted">{job.lessonTitle} · job #{job.id}</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{job.targetLanguage}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {job.requestedByName ?? '—'}
                  {job.requestedByEmail && <div className="text-xs">{job.requestedByEmail}</div>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      job.status === 'FAILED'
                        ? job.superseded
                          ? 'bg-line-soft text-ink-muted'
                          : 'border border-danger/40 bg-surface-raised text-danger'
                        : job.status === 'COMPLETED'
                          ? 'bg-success-tint text-success-ink'
                          : job.status === 'SKIPPED' || job.status === 'CANCELLED'
                            ? 'bg-line-soft text-ink-muted'
                            : 'bg-tint text-accent-dark'
                    }`}
                  >
                    {STATUS_LABEL[job.status]}
                  </span>
                  {job.superseded && <div className="mt-1 text-xs text-success-ink">Đã có bản lồng tiếng thành công</div>}
                </td>
                <td className="px-4 py-3 text-ink-muted">{job.doneChunks}/{job.totalChunks} ({job.progressPercent}%)<div className="text-xs">Thử lại {job.retryCount}/3</div></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                  Tạo {dateTime(job.createdAt)}
                  {job.finishedAt && <div>Xong {dateTime(job.finishedAt)}</div>}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-ink-muted"><span className="line-clamp-2" title={job.errorMessage ?? ''}>{job.errorMessage ?? '—'}</span></td>
                <td className="px-4 py-3 text-right">
                  {job.retryable && (
                    <button
                      type="button"
                      onClick={() => setConfirming(job)}
                      aria-label={`Thử lại: ${job.lessonTitle}`}
                      disabled={retryJob.isPending}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-accent-dark hover:bg-tint disabled:opacity-50"
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

      {data && <Pager page={page} totalPages={Math.max(1, data.totalPages)} total={data.totalElements} onPage={setPage} />}

      <ConfirmDialog
        open={confirming !== null}
        tone="primary"
        title="Thử lại lồng tiếng?"
        body={
          confirming
            ? `Bài "${confirming.lessonTitle}" (${confirming.targetLanguage}) sẽ được dịch và đọc lại từ đầu, việc này tốn chi phí AI. Chỉ thử lại khi bạn chắc chắn bài này chưa có bản lồng tiếng dùng được.`
            : ''
        }
        confirmLabel="Thử lại"
        cancelLabel="Hủy"
        onConfirm={doRetry}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
