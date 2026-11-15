import Link from 'next/link';

export interface SectionTab {
  key: string;
  href: string;
  label: string;
  /** Số thông báo chưa đọc của mục này (không truyền hoặc 0 = không hiện huy hiệu). */
  badge?: number;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  pathname: string;
  ariaLabel: string;
}

/** Thanh tab ngang dùng chung cho các khu của Kênh giảng viên (Hiệu suất, Giao tiếp...): mục sáng khi đường dẫn trùng chính
 * xác, đánh dấu bằng aria-current, cuộn ngang được trên màn nhỏ. */
export function SectionTabs({ tabs, pathname, ariaLabel }: SectionTabsProps) {
  return (
    <nav aria-label={ariaLabel} className="-mb-1 overflow-x-auto border-b border-line">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold no-underline transition-colors ${
                active ? 'border-accent text-accent-dark' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
              {(tab.badge ?? 0) > 0 && (
                <span
                  aria-label={`${tab.badge} chưa đọc`}
                  className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white"
                >
                  {(tab.badge ?? 0) > 99 ? '99+' : tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
