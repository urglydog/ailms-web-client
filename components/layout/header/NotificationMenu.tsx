'use client';

import { useState } from 'react';
import { BellOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { groupNotifications, type NotificationItem } from '@/lib/notifications/groups';
import { formatRelative } from '@/lib/myCourses/relativeTime';

type Tab = 'main' | 'system' | 'unread';
const TABS: Tab[] = ['main', 'system', 'unread'];
const TAB_KEY: Record<Tab, 'tabMain' | 'tabSystem' | 'tabUnread'> = {
  main: 'tabMain',
  system: 'tabSystem',
  unread: 'tabUnread',
};

interface NotificationMenuProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  /** Mở liên kết của thông báo (đóng menu và điều hướng do nơi gọi quyết định). */
  onOpenLink: (url: string) => void;
}

/** Bảng thông báo xổ ra từ chuông ở Header: 3 tab (Tin chính, Hệ thống, Chưa đọc), đánh dấu đã đọc từng tin hoặc tất cả. */
export function NotificationMenu({ notifications, unreadCount, onMarkRead, onMarkAllRead, onOpenLink }: NotificationMenuProps) {
  const t = useTranslations('header.notifications');
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>('main');
  const groups = groupNotifications(notifications);
  const visible = groups[tab];

  return (
    <div className="w-96 max-w-[calc(100vw-1.5rem)] rounded-panel border border-line bg-white p-2 shadow-card-hover">
      <div className="flex items-center justify-between border-b border-line-soft px-2 pb-2 pt-1">
        <span className="font-display text-[13.5px] font-bold text-ink">{t('title')}</span>
        {unreadCount > 0 && (
          <button type="button" onClick={onMarkAllRead} className="text-[11.5px] font-semibold text-accent-dark hover:underline">
            {t('markAllRead')}
          </button>
        )}
      </div>

      <div role="tablist" aria-label={t('tabsAria')} className="flex gap-1 px-1 py-2">
        {TABS.map((key) => {
          const selected = key === tab;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors ${
                selected ? 'bg-accent text-white' : 'text-ink-muted hover:bg-tint hover:text-accent-dark'
              }`}
            >
              {t(TAB_KEY[key])} <span className={selected ? 'text-white/80' : 'text-ink-muted'}>({groups[key].length})</span>
            </button>
          );
        })}
      </div>

      <div className="flex max-h-[26rem] flex-col gap-0.5 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-[12.5px] text-ink-muted">
            <BellOff size={22} aria-hidden className="text-ink-muted" />
            {t('empty')}
          </div>
        ) : (
          visible.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.isRead) onMarkRead(n.id);
                if (n.linkUrl) onOpenLink(n.linkUrl);
              }}
              className={`flex w-full gap-2.5 rounded-xl p-3 text-left ${n.isRead ? 'hover:bg-surface' : 'bg-tint'} ${
                n.linkUrl ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                aria-label={n.isRead ? undefined : t('unreadDot')}
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-accent'}`}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                <span className="text-[12.5px] text-ink-muted">{n.content}</span>
                <span className="text-[11px] text-ink-muted">{formatRelative(n.createdAt, locale)}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
