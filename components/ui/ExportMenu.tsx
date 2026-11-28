'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api/client';

export interface ExportMenuItem {
  id: string;
  label: string;
  /** Mô tả ngắn hiện dưới nhãn (vd "Bảng tính nhiều trang"). */
  hint?: string;
  icon?: ReactNode;
  /** Thực hiện hành động (tải file, gửi email...). Lỗi được báo bằng thông báo, không cần tự bắt. */
  onSelect: () => Promise<void> | void;
}

interface Props {
  items: ExportMenuItem[];
  label?: string;
  disabled?: boolean;
  /** Căn mép phải của menu với nút (mặc định) hoặc mép trái. */
  align?: 'right' | 'left';
}

/**
 * Nút "Chia sẻ" duy nhất cho mọi thao tác xuất/gửi (PDF, CSV, XLSX, gửi email...): thay cho nhiều nút nhỏ rời rạc.
 * Đóng khi bấm ra ngoài hoặc nhấn Escape; mục đang chạy bị khóa và hiện "Đang xử lý...".
 */
export function ExportMenu({ items, label, disabled = false, align = 'right' }: Props) {
  const t = useTranslations('common.export');
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = async (item: ExportMenuItem) => {
    setBusyId(item.id);
    try {
      await item.onSelect();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('failed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-50"
      >
        <Share2 size={15} aria-hidden />
        {label ?? t('share')}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1.5 flex min-w-56 flex-col rounded-xl border border-line bg-surface-raised p-1.5 shadow-card-hover ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={busyId !== null}
              onClick={() => run(item)}
              className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-tint disabled:opacity-60"
            >
              <span className="mt-0.5 text-ink-muted">{item.icon}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{busyId === item.id ? t('busy') : item.label}</span>
                {item.hint && <span className="text-xs text-ink-muted">{item.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
