'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@/types/domain';

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId: number | null | undefined;
}

/** Chiều cao bục theo hạng và màu huy chương (vàng, bạc, đồng); dùng token sẵn có. */
const STAND: Record<number, { height: string; badge: string }> = {
  1: { height: 'h-28', badge: 'bg-star text-ink' },
  2: { height: 'h-20', badge: 'bg-line text-ink' },
  3: { height: 'h-16', badge: 'bg-warning text-ink' },
};

/** Bục top 3 của bảng xếp hạng: hạng 2, hạng 1, hạng 3 từ trái sang phải; mỗi người là liên kết tới tab Chứng chỉ ở hồ sơ. */
export function Podium({ entries, currentUserId }: PodiumProps) {
  const t = useTranslations('community');
  const top = entries.filter((e) => e.rank >= 1 && e.rank <= 3);
  if (top.length === 0) return null;

  const byRank = (rank: number) => top.find((e) => e.rank === rank);
  const ordered = [byRank(2), byRank(1), byRank(3)].filter((e): e is LeaderboardEntry => !!e);

  return (
    <div role="group" aria-label={t('podiumAria')} className="mb-6 flex items-end justify-center gap-3 sm:gap-5">
      {ordered.map((entry, index) => {
        const stand = STAND[entry.rank] ?? STAND[3]!;
        const isMe = entry.userId === currentUserId;
        return (
          <Link
            key={entry.userId}
            href={`/u/${entry.userId}?tab=certificates`}
            aria-current={isMe ? 'true' : undefined}
            style={{ '--i': index } as CSSProperties}
            className="ranking-item-enter flex w-28 flex-col items-center gap-1.5 no-underline hover:no-underline sm:w-36"
          >
            <Avatar name={entry.fullName} avatarUrl={entry.avatarUrl} size={entry.rank === 1 ? 64 : 52} />
            <span className="max-w-full truncate text-[13px] font-semibold text-ink">{entry.fullName}</span>
            <span className="text-[12.5px] font-bold text-accent-dark">{t('xp', { xp: entry.totalXp })}</span>
            <span
              className={`flex w-full items-start justify-center rounded-t-lg pt-2 font-display text-lg font-bold ${stand.height} ${stand.badge} ${
                isMe ? 'ring-2 ring-accent ring-offset-1' : ''
              }`}
            >
              {entry.rank}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
