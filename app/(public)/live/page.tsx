'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LiveFeedCard } from '@/components/live/LiveFeedCard';
import { useEnrolledLiveFeed, usePublicLiveFeed } from '@/hooks/useLiveView';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { LiveFeedItem } from '@/types/domain';

type FeedTab = 'public' | 'enrolled';

const TABS: Array<{ value: FeedTab; labelKey: 'tabPublic' | 'tabEnrolled' }> = [
  { value: 'public', labelKey: 'tabPublic' },
  { value: 'enrolled', labelKey: 'tabEnrolled' },
];

/**
 * F11.9 — trang khám phá buổi Live, lối vào mới ngang hàng "Khóa học" ở `Header.tsx`. Trước đây
 * buổi live chỉ xem được qua banner trên trang khóa học (`CourseLiveBanner`) hoặc link trực tiếp —
 * trang này KHÔNG thay thế 2 lối đó, chỉ thêm 1 nơi liệt kê TẤT CẢ buổi live đang/sắp diễn ra.
 *
 * 2 sub-tab đúng theo `LiveVisibility` đã có sẵn (BR-LIVE-01) — không phải khái niệm mới, chỉ lộ
 * ra UI. Danh sách PHẲNG, không nhóm theo khóa học (quyết định có chủ đích: mục tiêu học viên vào
 * đây là "có gì đáng xem ngay", không phải "khóa X có buổi nào").
 */
export default function LivePage() {
  const t = useTranslations('pages.live');
  const [tab, setTab] = useState<FeedTab>('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
  }, []);

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">{t('title')}</h1>
      <p className="mb-8 text-sm text-ink-muted">
        {t('subtitle')}
      </p>

      <div className="mb-6 flex w-fit gap-1 rounded-full border border-line bg-surface-raised p-1">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.value}
            type="button"
            onClick={() => setTab(tabItem.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === tabItem.value ? 'bg-accent text-white' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {tab === 'public' ? (
        <PublicFeedSection />
      ) : isAuthenticated ? (
        <EnrolledFeedSection />
      ) : (
        <RequireLoginInline />
      )}
    </div>
  );
}

function PublicFeedSection() {
  const t = useTranslations('pages.live');
  const { data, isLoading, error } = usePublicLiveFeed();
  return (
    <FeedList
      items={data}
      isLoading={isLoading}
      error={error}
      emptyMessage={t('emptyPublic')}
    />
  );
}

function EnrolledFeedSection() {
  const t = useTranslations('pages.live');
  const { data, isLoading, error } = useEnrolledLiveFeed();
  return (
    <FeedList
      items={data}
      isLoading={isLoading}
      error={error}
      emptyMessage={t('emptyEnrolled')}
    />
  );
}

function FeedList({
  items,
  isLoading,
  error,
  emptyMessage,
}: {
  items: LiveFeedItem[] | undefined;
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
}) {
  const t = useTranslations('pages.live');
  if (isLoading) {
    return <p className="text-sm text-ink-muted">{t('loading')}</p>;
  }

  if (error) {
    return (
      <div className="card p-4 text-sm text-danger">
        {error instanceof ApiError ? error.message : t('loadError')}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-ink-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <LiveFeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/** BR-LIVE-02 tinh thần tương tự (chặn hành động cần đăng nhập, không chặn nhìn thấy tính năng) —
 * khác `RequireLoginModal` (chặn 1 HÀNH ĐỘNG cụ thể lúc đang xem live): đây là nội dung TĨNH luôn
 * hiện trong tab khi chưa đăng nhập, không phải modal — Guest bấm tab vẫn thấy tab tồn tại + biết
 * cần làm gì để dùng được, đúng quyết định lúc thiết kế (Câu 4, phương án A). */
function RequireLoginInline() {
  const t = useTranslations('pages.live');
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-3xl" aria-hidden>
        🔒
      </span>
      <p className="font-display text-lg font-semibold text-ink">
        {t('loginTitle')}
      </p>
      <p className="max-w-sm text-sm text-ink-muted">
        {t('loginDesc')}
      </p>
      <div className="mt-1 flex gap-2">
        <Link
          href="/login"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-dark"
        >
          {t('login')}
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-surface-hover"
        >
          {t('register')}
        </Link>
      </div>
    </div>
  );
}
