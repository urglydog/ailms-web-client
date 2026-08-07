/** Thanh tiến độ upload dùng chung cho video/tài liệu (UC34, UC35)/ảnh bìa — theo dõi %XHR upload. */
export function UploadProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11.5px] text-gray-500">
        {label} {percent}%
      </span>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full rounded-full bg-cyan-600 transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
