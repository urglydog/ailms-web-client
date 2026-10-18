'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLeaderboard, useMyRanking } from '@/hooks/useRanking';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@/types/domain';

/**
 * Ranking cộng đồng theo XP (UpComming_Plan.md, Epic "Ranking cộng đồng") — CỐ TÌNH đặt ở trang chủ (banner dễ
 * thấy, có animation lúc vào trang) thay vì nhúng vào hồ sơ cá nhân/công khai: hồ sơ cá nhân nên giữ ít chức năng
 * thao tác, ranking cần "đập vào mắt" để tạo động lực cạnh tranh.
 *
 * BE CHỈ trả user có total_xp > 0 (`RankingService.getLeaderboard`) — user 0 XP không có thứ hạng thật.
 * Rút về top 3 + nút "Xem toàn bộ" trỏ `/community` (trang đầy đủ). Mỗi hạng trỏ `/u/{userId}?tab=certificates`.
 * Giao diện azure: nền xanh nhạt, huy chương vàng/bạc/đồng ở ô hạng; chữ số XP dùng màu accent-dark để đạt tương
 * phản AA (màu vàng chỉ dùng làm nền, không làm chữ).
 */
export function RankingBanner() {
  const t = useTranslations('community');
  const { data: leaderboard, isLoading } = useLeaderboard(3);
  const { data: currentUser } = useCurrentUser();
  const { data: myRanking } = useMyRanking(!!currentUser);

  if (isLoading || !leaderboard || leaderboard.length === 0) return null;

  const isMeInTopList = leaderboard.some((entry) => entry.userId === currentUser?.id);
  const showMyRankPin = !!currentUser && !!myRanking?.ranked && !isMeInTopList;

  return (
    <section className="shell pt-6">
      <div className="ranking-banner-enter card flex flex-col gap-4 border-line bg-tint p-5 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/community" className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-star">
            <Trophy className="h-[18px] w-[18px] text-ink" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="font-display text-[15px] font-bold text-ink">{t('title')}</span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-3">
          {leaderboard.map((entry, idx) => (
            <RankPill key={entry.userId} entry={entry} index={idx} isMe={entry.userId === currentUser?.id} xp={t('xp', { xp: entry.totalXp })} />
          ))}

          {showMyRankPin && myRanking && (
            <span className="shrink-0 rounded-full border border-dashed border-accent bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-muted">
              {t('yourRankInline', { rank: myRanking.rank, xp: myRanking.totalXp })}
            </span>
          )}
        </div>

        <Link href="/community" className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-accent-dark no-underline hover:underline">
          {t('viewAll')} →
        </Link>
      </div>
    </section>
  );
}

/** Ô hạng kiểu bục huy chương: #1 vàng, #2 bạc, #3 đồng; chữ luôn tối để đủ tương phản. */
function medal(rank: number): string {
  if (rank === 1) return 'bg-star text-ink';
  if (rank === 2) return 'bg-line text-ink';
  if (rank === 3) return 'bg-warning text-ink';
  return 'bg-white text-ink-muted';
}

function RankPill({ entry, index, isMe, xp }: { entry: LeaderboardEntry; index: number; isMe: boolean; xp: string }) {
  return (
    <Link
      href={`/u/${entry.userId}?tab=certificates`}
      style={{ '--i': index } as CSSProperties}
      className={`ranking-item-enter flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 no-underline hover:no-underline ${
        entry.rank === 1 ? 'ranking-rank-1-glow' : ''
      } ${isMe ? 'ring-2 ring-accent ring-offset-1' : ''}`}
    >
      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold ${medal(entry.rank)}`}>
        {entry.rank}
      </span>
      <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={24} />
      <span className="max-w-[110px] truncate text-[13px] font-semibold text-ink">{entry.fullName}</span>
      <span className="text-[12px] font-bold text-accent-dark">{xp}</span>
    </Link>
  );
}
