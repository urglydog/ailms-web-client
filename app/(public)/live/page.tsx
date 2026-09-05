'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LiveFeedCard } from '@/components/live/LiveFeedCard';
import { useEnrolledLiveFeed, usePublicLiveFeed } from '@/hooks/useLiveView';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { LiveFeedItem } from '@/types/domain';

type FeedTab = 'public' | 'enrolled';

const TABS: Array<{ value: FeedTab; label: string }> = [
  { value: 'public', label: 'Công khai' },
  { value: 'enrolled', label: 'Khóa học của tôi' },
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
  const [tab, setTab] = useState<FeedTab>('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
  }, []);

  return (
    <div className="shell py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">Buổi live</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Xem trực tiếp cùng giảng viên — chọn ngôn ngữ lồng tiếng nếu cần.
      </p>

      <div className="mb-6 flex w-fit gap-1 rounded-full border border-line bg-surface-raised p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.value ? 'bg-accent text-white' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            {t.label}
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
  const { data, isLoading, error } = usePublicLiveFeed();
  return (
    <FeedList
      items={data}
      isLoading={isLoading}
      error={error}
      emptyMessage="Hiện chưa có buổi live công khai nào đang hoặc sắp diễn ra."
    />
  );
}

function EnrolledFeedSection() {
  const { data, isLoading, error } = useEnrolledLiveFeed();
  return (
    <FeedList
      items={data}
      isLoading={isLoading}
      error={error}
      emptyMessage="Các khóa học bạn đã ghi danh hiện chưa có buổi live nào đang hoặc sắp diễn ra."
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
  if (isLoading) {
    return <p className="text-sm text-ink-muted">Đang tải…</p>;
  }

  if (error) {
    return (
      <div className="card p-4 text-sm text-red-600">
        {error instanceof ApiError ? error.message : 'Không tải được danh sách buổi live.'}
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
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-3xl" aria-hidden>
        🔒
      </span>
      <p className="font-display text-lg font-semibold text-ink">
        Đăng nhập để xem buổi live của khóa học bạn đã ghi danh
      </p>
      <p className="max-w-sm text-sm text-ink-muted">
        Buổi live riêng của từng khóa học chỉ hiện cho học viên đã ghi danh khóa đó.
      </p>
      <div className="mt-1 flex gap-2">
        <Link
          href="/login"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-dark"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-gray-50"
        >
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
