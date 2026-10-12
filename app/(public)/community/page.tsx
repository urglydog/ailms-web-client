'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Trophy, Flame } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLeaderboard, useMyRanking } from '@/hooks/useRanking';
import { useStreak } from '@/hooks/useStreak';
import { Avatar } from '@/components/ui/Avatar';
import { StreakCard } from '@/components/streak/StreakCard';
import type { LeaderboardEntry } from '@/types/domain';

const LEADERBOARD_LIMIT = 30;

/**
 * Trang Cộng đồng (12/10/2026) — tách bảng xếp hạng ra khỏi trang chủ vì banner cũ
 * (`RankingBanner`) chiếm diện tích trang chủ mà chỉ hiện được 5 người, không có chỗ cho
 * animation/khoe thành tích đúng nghĩa. Trang chủ giờ chỉ giữ 1 widget rút gọn trỏ sang đây.
 *
 * Click vào 1 hạng → `/u/{userId}?tab=certificates`: trang hồ sơ công khai đã có sẵn tab
 * "Chứng chỉ" đầy đủ (card chứng chỉ, sort, phân biệt chủ sở hữu/người khác) — không tạo trang
 * chứng chỉ riêng, chỉ mở sẵn đúng tab khi điều hướng từ đây.
 */
export default function CommunityPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: leaderboard, isLoading } = useLeaderboard(LEADERBOARD_LIMIT);
  const { data: myRanking } = useMyRanking(!!currentUser);
  const { data: streakData } = useStreak(!!currentUser);

  const isMeInList = !!leaderboard?.some((entry) => entry.userId === currentUser?.id);
  const showMyRankCard = !!currentUser && !!myRanking?.ranked && !isMeInList;

  return (
    <div className="shell py-10">
      <div className="ranking-banner-enter mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-star/15">
          <Trophy className="h-7 w-7 text-star" strokeWidth={2.25} />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">Bảng xếp hạng cộng đồng</h1>
        <p className="max-w-[48ch] text-sm text-ink-muted">
          Tích luỹ XP mỗi ngày học bài, làm quiz, giữ streak — thi đua cùng cả cộng đồng.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card overflow-hidden p-0">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-ink-muted">Đang tải bảng xếp hạng...</p>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">Chưa có ai trên bảng xếp hạng.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {leaderboard.map((entry, idx) => (
                <RankRow key={entry.userId} entry={entry} index={idx} isMe={entry.userId === currentUser?.id} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {showMyRankCard && myRanking && (
            <div className="card flex flex-col gap-1.5 border-dashed border-accent/40 p-5">
              <span className="text-xs font-semibold text-ink-muted">Vị trí của bạn</span>
              <span className="font-display text-xl font-bold text-accent">#{myRanking.rank}</span>
              <span className="text-sm font-semibold text-ink">{myRanking.totalXp} XP</span>
            </div>
          )}

          {currentUser && streakData && <StreakCard streak={streakData} />}

          {!currentUser && (
            <div className="card flex flex-col gap-2 p-5 text-center">
              <Flame className="mx-auto h-6 w-6 text-star" />
              <p className="text-sm text-ink-muted">Đăng nhập để theo dõi streak và vị trí của bạn.</p>
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-accent-dark"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Màu theo hạng kiểu bục huy chương — giống `RankingBanner`, giữ nhất quán thị giác giữa
 * widget rút gọn trang chủ và trang đầy đủ. */
function rankStyle(rank: number): { text: string } {
  if (rank === 1) return { text: 'text-star' };
  if (rank === 2) return { text: 'text-ink-muted' };
  if (rank === 3) return { text: 'text-warning' };
  return { text: 'text-ink-faint' };
}

function RankRow({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const style = rankStyle(entry.rank);
  return (
    <li
      style={{ '--i': index } as CSSProperties}
      className={`ranking-item-enter ${entry.rank === 1 ? 'ranking-rank-1-glow' : ''}`}
    >
      <Link
        href={`/u/${entry.userId}?tab=certificates`}
        className={`flex items-center gap-4 px-5 py-3.5 no-underline hover:bg-surface hover:no-underline ${
          isMe ? 'bg-accent/5' : ''
        }`}
      >
        <span className={`w-8 shrink-0 text-center font-display text-base font-bold ${style.text}`}>
          #{entry.rank}
        </span>
        <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={36} />
        <span className="flex-1 truncate text-[14px] font-semibold text-ink">{entry.fullName}</span>
        <span className="shrink-0 text-[13px] font-bold text-star">{entry.totalXp} XP</span>
      </Link>
    </li>
  );
}
