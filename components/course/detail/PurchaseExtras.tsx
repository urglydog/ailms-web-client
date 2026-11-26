'use client';

import { useEffect, useState } from 'react';
import { AlarmClock, Gift, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';

const SHOW_WITHIN_MS = 30 * 24 * 3600 * 1000;

/** Phần còn lại tới `endsAt`, hoặc null khi đã qua / còn quá xa (không đáng nhấn mạnh). */
export function remaining(endsAt: string, now: number): { d: number; h: number; m: number; s: number } | null {
  const ms = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0 || ms > SHOW_WITHIN_MS) return null;
  const sec = Math.floor(ms / 1000);
  return { d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "Ưu đãi kết thúc sau …" (UDEMY_LAYOUT_ANALYSIS mục 13) — chỉ khi coupon tự áp có hạn trong 30 ngày. */
export function PromoCountdown({ endsAt }: { endsAt: string | null | undefined }) {
  const t = useTranslations('courseDetail.promo');
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (!endsAt || now === null) return null;
  const r = remaining(endsAt, now);
  if (!r) return null;
  const text = r.d > 0 ? t('days', { d: r.d, h: r.h }) : `${pad(r.h)}:${pad(r.m)}:${pad(r.s)}`;
  return (
    <p className="m-0 flex items-center gap-1.5 text-[13px] font-semibold text-danger">
      <AlarmClock size={15} aria-hidden className="shrink-0" />
      <span>
        {t('endsIn')} <time dateTime={endsAt} className="tabular-nums">{text}</time>
      </span>
    </p>
  );
}

/** Nút Chia sẻ (chia sẻ gốc của thiết bị nếu có, không thì chép link) + Tặng (chưa hỗ trợ, "Sắp ra mắt"). */
export function ShareGiftButtons({ title, slug }: { title: string; slug: string }) {
  const t = useTranslations('courseDetail.shareGift');
  const share = async () => {
    const url = `${window.location.origin}/courses/${slug}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };
  const base =
    'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-control border border-line bg-surface-raised px-3 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none';
  return (
    <div className="flex gap-2">
      <button type="button" onClick={share} className={`${base} hover:border-accent hover:text-accent-dark`}>
        <Share2 size={16} aria-hidden />
        {t('share')}
      </button>
      <Tooltip label={t('soon')} className="flex flex-1">
        <button type="button" aria-disabled="true" onClick={(e) => e.preventDefault()} className={`${base} w-full cursor-not-allowed opacity-60`}>
          <Gift size={16} aria-hidden />
          {t('gift')}
          <span className="sr-only">({t('soon')})</span>
        </button>
      </Tooltip>
    </div>
  );
}
