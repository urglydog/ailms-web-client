'use client';

import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';

/**
 * Khay tải lên kiểu Google Drive (Giai đoạn 4 — UC34, UC35) — đặt 1 lần ở layout Giảng viên
 * nên sống sót qua việc đóng modal hay chuyển trang trong khu vực Giảng viên. Tự ẩn hoàn toàn
 * khi không còn tác vụ nào (mỗi tác vụ thành công tự biến mất sau vài giây — xem
 * `uploadTrayStore.ts`); tác vụ lỗi ở lại cho tới khi người dùng bấm đóng, tránh bị bỏ sót.
 */
export function UploadTray() {
  const tasks = useUploadTrayStore((s) => s.tasks);
  const isOpen = useUploadTrayStore((s) => s.isOpen);
  const toggleOpen = useUploadTrayStore((s) => s.toggleOpen);
  const dismissTask = useUploadTrayStore((s) => s.dismissTask);
  const cancelTask = useUploadTrayStore((s) => s.cancelTask);

  if (tasks.length === 0) return null;

  const uploadingCount = tasks.filter((t) => t.status === 'uploading').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;
  const summary =
    uploadingCount > 0
      ? `Đang tải lên (${uploadingCount})`
      : errorCount > 0
        ? `${errorCount} tác vụ lỗi`
        : 'Đã tải xong';

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-2 bg-gray-900 px-4 py-2.5 text-left text-[13px] font-semibold text-white"
      >
        <span className="truncate">{summary}</span>
        <span aria-hidden className="shrink-0">
          {isOpen ? '▾' : '▴'}
        </span>
      </button>

      {isOpen && (
        <div className="max-h-72 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="border-b border-gray-100 px-4 py-2.5 last:border-0">
              {task.status === 'uploading' && (
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <UploadProgressBar percent={task.percent} label={task.label} />
                  </div>
                  {task.abort && (
                    <button
                      type="button"
                      onClick={() => cancelTask(task.id)}
                      className="shrink-0 pb-0.5 text-[11px] font-bold text-red-500 hover:text-red-700"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              )}

              {task.status === 'success' && (
                <div className="flex items-center gap-2 text-[12.5px] text-green-700">
                  <span aria-hidden>✓</span>
                  <span className="min-w-0 flex-1 truncate">{task.label}</span>
                  <span className="shrink-0 text-gray-400">Xong</span>
                </div>
              )}

              {task.status === 'error' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-red-700">
                      {task.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissTask(task.id)}
                      className="shrink-0 text-[11px] font-bold text-red-500 hover:text-red-700"
                    >
                      Đóng
                    </button>
                  </div>
                  <span className="text-[11.5px] text-red-600">{task.errorMessage}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
