'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Flame, Settings, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Role } from '@/types/domain';

interface ProfileBannerProps {
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  memberSince: string;
  certificateCount: number;
  /** `null` khi chủ hồ sơ đã ẩn danh sách khóa học. */
  courseCount: number | null;
  /** Chỉ truyền khi xem hồ sơ của chính mình. */
  streak: number | null;
  isOwnProfile: boolean;
  onShare: () => void;
}

export function ProfileBanner({
  fullName,
  avatarUrl,
  role,
  memberSince,
  certificateCount,
  courseCount,
  streak,
  isOwnProfile,
  onShare,
}: ProfileBannerProps) {
  const t = useTranslations('profile');
  const showStreak = isOwnProfile && streak !== null;

  return (
    <div className="border-b border-line bg-tint">
      <div className="shell flex flex-col gap-6 py-8 md:flex-row md:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-4xl font-bold text-white">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            fullName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-accent-dark">
            {role === 'INSTRUCTOR' ? t('role.instructor') : t('role.student')}
          </span>
          <h1 className="font-display text-3xl font-bold text-ink">{fullName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t('memberSince', { date: format(new Date(memberSince), 'dd/MM/yyyy') })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t('share')}
            </button>
            {isOwnProfile && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent-dark no-underline hover:bg-surface"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                {t('settings')}
              </Link>
            )}
          </div>
        </div>

        <dl className="flex gap-3">
          <Stat value={certificateCount} label={t('stats.certificates')} />
          {courseCount !== null && <Stat value={courseCount} label={t('stats.courses')} />}
          {showStreak && (
            <Stat value={streak} label={t('stats.streak')} icon={<Flame className="h-4 w-4" aria-hidden="true" />} />
          )}
        </dl>
      </div>
    </div>
  );
}

function Stat({ value, label, icon }: { value: number; label: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-[88px] rounded-[10px] border border-line bg-white px-4 py-3 text-center">
      <dd className="flex items-center justify-center gap-1 font-display text-2xl font-bold text-ink">
        {icon}
        {value}
      </dd>
      <dt className="text-xs text-ink-muted">{label}</dt>
    </div>
  );
}
