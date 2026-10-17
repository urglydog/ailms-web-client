'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useStreak } from '@/hooks/useStreak';
import { StarRating } from '@/components/ui/StarRating';
import { CertificatesPanel } from '@/components/profile/CertificatesPanel';
import { ProfileBanner } from '@/components/profile/ProfileBanner';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { resolveProfileTab, type ProfileTab } from '@/lib/profile/model';
import type { PublicCourseSummary } from '@/types/domain';

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

/**
 * Hồ sơ công khai. `courses`/`wishlist` là `null` (không phải mảng rỗng) khi chủ tài khoản đã
 * ẩn mục đó — "đã ẩn" khác "công khai nhưng chưa có gì". Streak là dữ liệu riêng tư (BE chỉ có
 * `/streak/me`) nên chỉ lấy và hiện khi tự xem hồ sơ của mình. Tab Chứng chỉ đứng đầu và là mặc
 * định; `?tab=` vẫn mở được tab khác.
 */
export default function PublicProfilePage() {
  return (
    <Suspense fallback={<LoadingNote />}>
      <PublicProfileContent />
    </Suspense>
  );
}

function LoadingNote() {
  const t = useTranslations('profile');
  return <div className="shell py-10 text-center text-sm text-ink-muted">{t('loading')}</div>;
}

function PublicProfileContent() {
  const t = useTranslations('profile');
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const userId = Number(params.userId);
  const { data: profile, isLoading, error } = usePublicProfile(userId);
  const { data: currentUser } = useCurrentUser();
  const isOwnProfile = currentUser?.id === userId;
  const { data: streakData } = useStreak(isOwnProfile);
  const [tab, setTab] = useState<ProfileTab>(resolveProfileTab(searchParams.get('tab')));

  async function shareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('shareCopied'));
    } catch {
      toast.error(t('shareFailed'));
    }
  }

  if (isLoading) return <LoadingNote />;

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="shell py-10 text-center text-sm text-ink-muted">
        {notFound ? t('notFound') : t('loadError')}
      </div>
    );
  }
  if (!profile) return null;

  const activeCourses = tab === 'courses' ? profile.courses : profile.wishlist;

  return (
    <div>
      <ProfileBanner
        fullName={profile.fullName}
        avatarUrl={profile.avatarUrl}
        role={profile.role}
        memberSince={profile.memberSince}
        certificateCount={profile.certificates.length}
        courseCount={profile.courses === null ? null : profile.courses.length}
        streak={isOwnProfile && streakData ? streakData.currentStreak : null}
        isOwnProfile={isOwnProfile}
        onShare={shareProfile}
      />

      <div className="shell py-8">
        <ProfileTabs active={tab} certificateCount={profile.certificates.length} onChange={setTab} />

        {tab === 'certificates' ? (
          <CertificatesPanel certificates={profile.certificates} isOwnProfile={isOwnProfile} />
        ) : activeCourses === null ? (
          <p className="text-sm text-ink-muted">{t('hidden')}</p>
        ) : activeCourses.length === 0 ? (
          <p className="text-sm text-ink-muted">{tab === 'courses' ? t('emptyCourses') : t('emptyWishlist')}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {activeCourses.map((course) => (
              <PublicCourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PublicCourseCard({ course }: { course: PublicCourseSummary }) {
  const t = useTranslations('profile');
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card-interactive flex flex-col overflow-hidden no-underline hover:no-underline"
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="h-full bg-tint" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {course.title}
        </span>
        <StarRating rating={course.avgRating} reviewCount={course.reviewCount} />
        <span className="mt-1 font-display text-[15px] font-bold text-ink">
          {course.isFree ? t('free') : formatPrice(course.price)}
        </span>
      </div>
    </Link>
  );
}
