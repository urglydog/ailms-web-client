import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

/** Ô tìm kiếm trực tiếp (lọc ngay khi gõ) cho các danh sách nhỏ đã có sẵn trong bộ nhớ; kết hợp với {@code useListControls} và {@code Pager}. */
export function ListSearch({ value, onChange, placeholder, label, className = '' }: Props) {
  return (
    <label className={`relative block w-full sm:w-72 ${className}`}>
      <span className="sr-only">{label}</span>
      <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-surface-raised py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
      />
    </label>
  );
}
