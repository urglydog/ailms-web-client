'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ToolDef } from './tools';

/** Thẻ một công cụ ở trang "Công cụ": biểu tượng, tên, mô tả; cả thẻ là liên kết. */
export function ToolCard({ tool }: { tool: ToolDef }) {
  const t = useTranslations('instructor.tools');
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href}
      className="group flex flex-col gap-3 rounded-xl border border-line bg-white p-5 no-underline shadow-sm transition-colors hover:border-accent hover:no-underline"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-accent-dark">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-display text-[15px] font-bold text-ink">{t(`items.${tool.id}.title`)}</span>
      <span className="text-[12.5px] leading-relaxed text-ink-muted">{t(`items.${tool.id}.description`)}</span>
      <span className="mt-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent-dark">
        {t('open')}
        <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
