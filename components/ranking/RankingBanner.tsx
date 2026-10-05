'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLeaderboard, useMyRanking } from '@/hooks/useRanking';
import { Avatar } from '@/components/ui/Avatar';

/**
 * Ranking cộng đồng theo XP (UpComming_Plan.md, Epic "Ranking cộng đồng") — CỐ TÌNH đặt ở
 * trang chủ (banner dễ thấy, có animation lúc vào trang) thay vì nhúng vào hồ sơ cá nhân/công
 * khai, theo đúng yêu cầu: hồ sơ cá nhân nên giữ ít chức năng thao tác, ranking cần "đập vào
 * mắt" để tạo động lực cạnh tranh, không phải thứ phải chủ động vào xem mới thấy.
 */
export function RankingBanner() {
  const { data: leaderboard, isLoading } = useLeaderboard(5);
  const { data: currentUser } = useCurrentUser();
  const { data: myRanking } = useMyRanking(!!currentUser);

  if (isLoading || !leaderboard || leaderboard.length === 0) return null;

  const isMeInTopList = leaderboard.some((entry) => entry.userId === currentUser?.id);
  const showMyRankPin = !!currentUser && !!myRanking && !isMeInTopList;

  return (
    <section className="shell pt-6">
      <div className="ranking-banner-enter card flex flex-col gap-4 border-accent/20 bg-gradient-to-r from-accent/5 via-surface-raised to-surface-raised p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <Trophy className="h-5 w-5 text-accent" strokeWidth={2} />
          <span className="font-display text-[15px] font-bold text-ink">Bảng xếp hạng cộng đồng</span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-3 overflow-x-auto">
          {leaderboard.map((entry) => {
            const isMe = entry.userId === currentUser?.id;
            return (
              <Link
                key={entry.userId}
                href={`/u/${entry.userId}`}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 no-underline hover:no-underline ${
                  isMe ? 'border-accent bg-accent/10' : 'border-line bg-white hover:bg-surface-hover'
                }`}
              >
                <span className="text-xs font-bold text-ink-faint">#{entry.rank}</span>
                <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={24} />
                <span className="max-w-[110px] truncate text-[13px] font-semibold text-ink">
                  {entry.fullName}
                </span>
                <span className="text-[12px] font-bold text-accent">{entry.totalXp} XP</span>
              </Link>
            );
          })}

          {showMyRankPin && (
            <span className="shrink-0 rounded-full border border-dashed border-accent/40 px-3 py-1.5 text-[13px] font-semibold text-ink-muted">
              Vị trí của bạn: <span className="text-accent">#{myRanking.rank}</span> · {myRanking.totalXp} XP
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
