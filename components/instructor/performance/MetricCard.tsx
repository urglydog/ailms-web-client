interface MetricCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}

/** Thẻ một chỉ số của khu Hiệu suất; nhãn và giá trị nằm trong cùng một nhóm có tên để trình đọc màn hình đọc liền nhau. */
export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div role="group" aria-label={label} className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <span aria-hidden className="text-[11.5px] font-semibold text-ink-muted">
        {label}
      </span>
      <div data-tone={tone} className={`mt-1 font-display text-[24px] font-extrabold ${tone === 'warning' ? 'text-danger' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}
