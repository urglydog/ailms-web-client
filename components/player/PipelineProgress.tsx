'use client';

import type { PipelineStep } from '@/types/domain';

/**
 * "Đang xử lý lồng tiếng AI" — UC20 (theo dõi tiến độ thời gian thực).
 *
 * Dữ liệu đến từ WebSocket: backend subscribe Redis Pub/Sub `lms:dubbing:progress`
 * rồi forward xuống client qua `useDubbingSocket` (F5.3) — component này chỉ nhận qua prop,
 * không tự kết nối socket.
 *
 * Hiển thị trong 1 card NHỎ bên dưới video (không còn thay thế cả khung video như trước) —
 * video vẫn đang phát audio gốc song song, nên style ở đây theo theme SÁNG của trang, không
 * còn mô phỏng nền tối của khung video nữa.
 *
 * Nhiều học viên cùng chờ một job (BR-DUB-05 dedupe) đều nhận cùng luồng sự kiện này.
 */

interface PipelineProgressProps {
  steps: PipelineStep[];
  percent?: number;
  onWatchOriginal: () => void;
  /** UC20 — huỷ job đang chạy thật (khác `onWatchOriginal`: chỉ ẩn panel, job vẫn chạy nền). */
  onCancel: () => void;
  isCancelling?: boolean;
}

export function PipelineProgress({ steps, percent, onWatchOriginal, onCancel, isCancelling }: PipelineProgressProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-ai-pulse rounded-full bg-accent-glow" aria-hidden />
          <span className="font-mono text-[11px] font-semibold tracking-widest text-accent">
            ĐANG XỬ LÝ LỒNG TIẾNG AI
          </span>
        </div>
        {percent !== undefined && (
          <span className="font-mono text-[11px] font-semibold text-ink-muted">{percent}%</span>
        )}
      </div>

      {percent !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ lồng tiếng"
          className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]
                ${
                  step.failed
                    ? 'bg-red-500 text-white'
                    : step.done
                      ? 'bg-success text-white'
                      : step.active
                        ? 'border-2 border-accent bg-transparent'
                        : 'border border-line bg-transparent'
                }`}
            >
              {step.failed && <span aria-hidden>✕</span>}
              {!step.failed && step.done && <span aria-hidden>✓</span>}
              {!step.failed && step.active && !step.done && (
                <span className="h-1.5 w-1.5 animate-ai-pulse rounded-full bg-accent" aria-hidden />
              )}
            </span>
            <span
              className={`text-[13px] ${
                step.failed
                  ? 'text-red-600'
                  : step.done
                    ? 'text-ink-faint'
                    : step.active
                      ? 'font-semibold text-ink'
                      : 'text-ink-faint'
              }`}
            >
              {step.label}
              {step.failed && ' — giữ âm thanh gốc cho đoạn này'}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onWatchOriginal}
          className="text-[13px] font-medium text-ink-muted underline-offset-4 hover:text-accent hover:underline"
        >
          Ẩn tiến độ, xem video
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isCancelling}
          className="text-[13px] font-medium text-red-600 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling ? 'Đang huỷ...' : 'Huỷ lồng tiếng'}
        </button>
      </div>
    </div>
  );
}
