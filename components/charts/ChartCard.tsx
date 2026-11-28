'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  /** Câu hỏi mà biểu đồ trả lời, vd "Doanh thu đang tăng hay giảm?". */
  question: string;
  /** Một câu kết luận rút ra từ số liệu (vd "Tăng 12% so với kỳ trước"); để trống nếu chưa đủ dữ liệu. */
  insight?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Khung biểu đồ thống nhất: câu hỏi ở trên, biểu đồ ở giữa, kết luận ngắn ở dưới. */
export function ChartCard({ question, insight, children, className = '' }: Props) {
  return (
    <section className={`flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-5 shadow-sm ${className}`}>
      <h2 className="m-0 font-display text-[15px] font-bold text-ink">{question}</h2>
      <div className="min-h-0 flex-1">{children}</div>
      {insight && <p className="m-0 text-sm text-ink-muted">{insight}</p>}
    </section>
  );
}

/** Mũi tên và % thay đổi so với kỳ trước; {@code upIsGood=false} cho chỉ số mà tăng là xấu (vd tiền hoàn). */
export function Delta({ current, previous, upIsGood = true }: { current: number; previous: number; upIsGood?: boolean }) {
  const t = useTranslations('common.delta');
  if (previous === 0 && current === 0) return <span className="text-xs text-ink-muted">{t('same')}</span>;
  if (previous === 0) return <span className="text-xs text-ink-muted">{t('noPrevious')}</span>;
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (pct === 0) return <span className="text-xs text-ink-muted">{t('same')}</span>;
  const up = pct > 0;
  const good = up === upIsGood;
  return (
    <span className={`text-xs font-semibold ${good ? 'text-success-ink' : 'text-danger'}`}>
      {t('vsPrevious', { arrow: up ? '▲' : '▼', pct: Math.abs(pct) })}
    </span>
  );
}
