'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Trophy, Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLeaderboard, useMyRanking } from '@/hooks/useRanking';
import { useStreak } from '@/hooks/useStreak';
import { Avatar } from '@/components/ui/Avatar';
import { Podium } from '@/components/community/Podium';
import { StreakCard } from '@/components/streak/StreakCard';
import type { LeaderboardEntry } from '@/types/domain';

const LEADERBOARD_LIMIT = 30;

/**
 * Trang Cộng đồng (12/10/2026) — tách bảng xếp hạng ra khỏi trang chủ vì banner cũ (`RankingBanner`) chỉ hiện
 * được vài người, không có chỗ cho animation/khoe thành tích đúng nghĩa. Trang chủ giờ chỉ giữ 1 widget rút gọn
 * trỏ sang đây.
 *
 * Bố cục: dải đầu trang sáng, bục top 3, rồi danh sách từ hạng 4 trở đi; cột phải là vị trí của mình và streak.
 * Click vào 1 hạng → `/u/{userId}?tab=certificates`: trang hồ sơ công khai đã có sẵn tab "Chứng chỉ" đầy đủ.
 *
 * Token đăng nhập chỉ có ở trình duyệt nên phần phụ thuộc người dùng (vị trí của mình, streak, lời mời đăng nhập)
 * chỉ hiện sau khi mount để HTML máy chủ và máy khách khớp nhau.
 */
export default function CommunityPage() {
  const t = useTranslations('community');
  const { data: currentUser } = useCurrentUser();
  const { data: leaderboard, isLoading } = useLeaderboard(LEADERBOARD_LIMIT);
  const { data: myRanking } = useMyRanking(!!currentUser);
  const { data: streakData } = useStreak(!!currentUser);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entries = leaderboard ?? [];
  const rest = entries.filter((e) => e.rank > 3);
  const isMeInList = entries.some((entry) => entry.userId === currentUser?.id);
  const showMyRankCard = !!currentUser && !!myRanking?.ranked && !isMeInList;

  return (
    <div>
      <div className="border-b border-line bg-tint">
        <div className="ranking-banner-enter shell flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-star">
            <Trophy className="h-7 w-7 text-ink" strokeWidth={2.25} aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">{t('title')}</h1>
          <p className="max-w-[52ch] text-sm text-ink-muted">{t('subtitle')}</p>
        </div>
      </div>

      <div className="shell py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <Podium entries={entries} currentUserId={currentUser?.id} />

            <div className="card overflow-hidden p-0">
              {isLoading ? (
                <p className="p-8 text-center text-sm text-ink-muted">{t('loading')}</p>
              ) : entries.length === 0 ? (
                <p className="p-8 text-center text-sm text-ink-muted">{t('empty')}</p>
              ) : rest.length > 0 ? (
                <ul aria-label={t('listAria')} className="m-0 list-none divide-y divide-line-soft p-0">
                  {rest.map((entry, idx) => (
                    <RankRow key={entry.userId} entry={entry} index={idx} isMe={entry.userId === currentUser?.id} />
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {mounted && showMyRankCard && myRanking && (
              <div className="card flex flex-col gap-1.5 border-dashed border-accent p-5">
                <span className="text-xs font-semibold text-ink-muted">{t('yourRank')}</span>
                <span className="font-display text-xl font-bold text-accent-dark">#{myRanking.rank}</span>
                <span className="text-sm font-semibold text-ink">{t('xp', { xp: myRanking.totalXp })}</span>
              </div>
            )}

            {mounted && currentUser && streakData && <StreakCard streak={streakData} />}

            {mounted && !currentUser && (
              <div className="card flex flex-col gap-2 p-5 text-center">
                <Flame className="mx-auto h-6 w-6 text-accent" aria-hidden />
                <p className="text-sm text-ink-muted">{t('loginHint')}</p>
                <Link
                  href="/login"
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
                >
                  {t('login')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankRow({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const t = useTranslations('community');
  return (
    <li style={{ '--i': index } as CSSProperties} className="ranking-item-enter">
      <Link
        href={`/u/${entry.userId}?tab=certificates`}
        aria-current={isMe ? 'true' : undefined}
        className={`flex items-center gap-4 px-5 py-3.5 no-underline hover:bg-surface hover:no-underline ${isMe ? 'bg-tint' : ''}`}
      >
        <span className="w-8 shrink-0 text-center font-display text-base font-bold text-ink-muted">#{entry.rank}</span>
        <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={36} />
        <span className="flex-1 truncate text-[14px] font-semibold text-ink">{entry.fullName}</span>
        <span className="shrink-0 text-[13px] font-bold text-accent-dark">{t('xp', { xp: entry.totalXp })}</span>
      </Link>
    </li>
  );
}
