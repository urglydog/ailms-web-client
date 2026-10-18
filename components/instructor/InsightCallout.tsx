'use client';

import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

type InsightTone = 'warning' | 'info';

const TONE_CLASS: Record<InsightTone, string> = {
  warning: 'border-highlight bg-white text-ink',
  info: 'border-line bg-tint text-accent-dark',
};

/** Hộp một dòng kết luận hoặc gợi ý hành động rút ra từ số liệu — dùng chung cho khu "Hiệu suất". Cảnh báo được báo qua
 * `role="alert"`; có `href` thì cả hộp là liên kết kèm chữ "Xem →" (dịch được). */
export function InsightCallout({ tone, href, children }: { tone: InsightTone; href?: string; children: React.ReactNode }) {
  const t = useTranslations('instructor.performance.insight');
  const Icon = tone === 'warning' ? AlertTriangle : Info;
  const content = (
    <div role={tone === 'warning' ? 'alert' : undefined} className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] leading-snug ${TONE_CLASS[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">{children}</span>
      {href && <span className="shrink-0 font-semibold">{t('see')}</span>}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block no-underline hover:opacity-90">
      {content}
    </Link>
  );
}
