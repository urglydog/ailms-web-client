'use client';

import type { PipelineStep } from '@/types/domain';

/**
 * Panel "Đang xử lý lồng tiếng AI" — UC20 (theo dõi tiến độ thời gian thực).
 *
 * Dữ liệu đến từ WebSocket: backend subscribe Redis Pub/Sub `lms:dubbing:progress`
 * rồi forward xuống client. Giai đoạn 6 sẽ nối vào socket thật; hiện nhận qua prop.
 *
 * BR-CHUNK-03 — điểm cốt lõi: **ngay khi phân đoạn đầu tiên xong**, học viên đã vào
 * học được, không phải chờ hết video. Vì vậy panel này luôn kèm lối "xem tạm với âm
 * thanh gốc trong lúc chờ".
 *
 * Nhiều học viên cùng chờ một job (BR-DUB-05 dedupe) đều nhận cùng luồng sự kiện này.
 */

interface PipelineProgressProps {
  steps: PipelineStep[];
  percent?: number;
  onWatchOriginal: () => void;
}

export function PipelineProgress({ steps, percent, onWatchOriginal }: PipelineProgressProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-8">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-ai-pulse rounded-full bg-accent-glow" aria-hidden />
        <span className="font-mono text-[11px] font-semibold tracking-widest text-accent-glow">
          ĐANG XỬ LÝ LỒNG TIẾNG AI
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px]
                ${
                  step.done
                    ? 'bg-success text-white'
                    : step.active
                      ? 'border-2 border-accent-glow bg-transparent'
                      : 'border border-white/25 bg-transparent'
                }`}
            >
              {step.done && <span aria-hidden>✓</span>}
              {step.active && !step.done && (
                <span className="h-2 w-2 animate-ai-pulse rounded-full bg-accent-glow" aria-hidden />
              )}
            </span>
            <span
              className={`text-sm ${
                step.done ? 'text-white/60' : step.active ? 'font-semibold text-white' : 'text-white/40'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {percent !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ lồng tiếng"
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"
        >
          <div
            className="h-full rounded-full bg-accent-glow transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onWatchOriginal}
        className="self-start text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Xem tạm với âm thanh gốc trong lúc chờ
      </button>
    </div>
  );
}
