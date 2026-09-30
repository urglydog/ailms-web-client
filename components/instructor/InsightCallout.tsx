import Link from 'next/link';

type InsightTone = 'warning' | 'info';

const TONE_CLASS: Record<InsightTone, string> = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
};

function WarningIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.29 3.86-8.18 14.18A2 2 0 0 0 4 21h16a2 2 0 0 0 1.89-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/** Box 1 dòng kết luận/gợi ý hành động rút ra từ số liệu — style dùng chung cho khu "Hiệu suất"
 * (29/09/2026, xây mới) để mọi trang không mỗi nơi bịa 1 kiểu cảnh báo/insight riêng. */
export function InsightCallout({
  tone,
  href,
  children,
}: {
  tone: InsightTone;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] leading-snug ${TONE_CLASS[tone]}`}>
      {tone === 'warning' ? <WarningIcon /> : <InfoIcon />}
      <span className="flex-1">{children}</span>
      {href && <span className="shrink-0 font-semibold">Xem →</span>}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block no-underline hover:opacity-90">
      {content}
    </Link>
  );
}
