'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Trophy } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLeaderboard, useMyRanking } from '@/hooks/useRanking';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@/types/domain';

/**
 * Ranking cộng đồng theo XP (UpComming_Plan.md, Epic "Ranking cộng đồng") — CỐ TÌNH đặt ở
 * trang chủ (banner dễ thấy, có animation lúc vào trang) thay vì nhúng vào hồ sơ cá nhân/công
 * khai, theo đúng yêu cầu: hồ sơ cá nhân nên giữ ít chức năng thao tác, ranking cần "đập vào
 * mắt" để tạo động lực cạnh tranh, không phải thứ phải chủ động vào xem mới thấy.
 *
 * (05/10/2026, sửa theo phản hồi) — 2 lần sửa so với bản đầu:
 * 1. BE giờ CHỈ trả user có total_xp > 0 (`RankingService.getLeaderboard`) — trước đây liệt kê
 *    cả user 0 XP vì chưa lọc, "hạng 1-5" của họ chỉ là thứ tự ngẫu nhiên trong DB, vô nghĩa.
 * 2. Bảng màu đổi từ accent xanh đơn sắc (lạnh, nhạt, không tương phản) sang điểm nhấn vàng/hổ
 *    phách (token `star`/`warning` có sẵn trong tailwind.config.ts) cho đúng cảm giác "huy
 *    chương" — ấm hơn, tương phản rõ hơn trên nền trắng-xanh lạnh của phần còn lại trang chủ.
 */
export function RankingBanner() {
  const { data: leaderboard, isLoading } = useLeaderboard(5);
  const { data: currentUser } = useCurrentUser();
  const { data: myRanking } = useMyRanking(!!currentUser);

  if (isLoading || !leaderboard || leaderboard.length === 0) return null;

  const isMeInTopList = leaderboard.some((entry) => entry.userId === currentUser?.id);
  const showMyRankPin = !!currentUser && !!myRanking?.ranked && !isMeInTopList;

  return (
    <section className="shell pt-6">
      <div className="ranking-banner-enter card flex flex-col gap-4 border-star/30 bg-gradient-to-r from-star/10 via-surface-raised to-surface-raised p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-star/15">
            <Trophy className="h-[18px] w-[18px] text-star" strokeWidth={2.25} />
          </span>
          <span className="font-display text-[15px] font-bold text-ink">Bảng xếp hạng cộng đồng</span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-3 overflow-x-auto">
          {leaderboard.map((entry, idx) => (
            <RankPill
              key={entry.userId}
              entry={entry}
              index={idx}
              isMe={entry.userId === currentUser?.id}
            />
          ))}

          {showMyRankPin && myRanking && (
            <span className="shrink-0 rounded-full border border-dashed border-accent/40 px-3 py-1.5 text-[13px] font-semibold text-ink-muted">
              Vị trí của bạn: <span className="text-accent">#{myRanking.rank}</span> · {myRanking.totalXp} XP
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** Màu theo hạng kiểu bục huy chương: #1 vàng (`star`), #2 bạc (xám trung tính), #3 đồng
 * (`warning`, hổ phách đậm hơn) — từ #4 trở đi về lại màu trung tính thông thường. */
function rankStyle(rank: number): { border: string; bg: string; text: string } {
  if (rank === 1) return { border: 'border-star', bg: 'bg-star/15', text: 'text-star' };
  if (rank === 2) return { border: 'border-line', bg: 'bg-surface', text: 'text-ink-muted' };
  if (rank === 3) return { border: 'border-warning/50', bg: 'bg-warning/10', text: 'text-warning' };
  return { border: 'border-line', bg: 'bg-white', text: 'text-ink-faint' };
}

function RankPill({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const style = rankStyle(entry.rank);
  return (
    <Link
      href={`/u/${entry.userId}`}
      style={{ '--i': index } as CSSProperties}
      className={`ranking-item-enter flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 no-underline hover:no-underline ${style.border} ${style.bg} ${
        entry.rank === 1 ? 'ranking-rank-1-glow' : ''
      } ${isMe ? 'ring-2 ring-accent ring-offset-1' : ''}`}
    >
      <span className={`text-xs font-bold ${style.text}`}>#{entry.rank}</span>
      <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={24} />
      <span className="max-w-[110px] truncate text-[13px] font-semibold text-ink">{entry.fullName}</span>
      <span className="text-[12px] font-bold text-star">{entry.totalXp} XP</span>
    </Link>
  );
}
