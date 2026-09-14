'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StarRating } from '@/components/ui/StarRating';
import type { PublicCourseSummary } from '@/types/domain';

type Tab = 'courses' | 'wishlist';

function formatPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`;
}

/**
 * "View public profile" (14/09/2026, mở rộng ngoài đặc tả gốc) — layout theo đúng trang hồ sơ
 * học viên của Udemy (`udemy.com/user/{slug}`): tiêu đề vai trò + tên lớn bên trái, 2 tab
 * "Đã học"/"Yêu thích" thay vì 2 mục xếp chồng, card khóa học nằm dưới tab đang chọn; cột phải
 * là khối avatar+nút đứng riêng (sticky). Khác Udemy: nút "Chỉnh sửa hồ sơ" ở cột phải CHỈ hiện
 * khi tự xem hồ sơ của chính mình (Udemy luôn hiện vì họ tách hẳn URL "your own profile" khỏi
 * URL xem người khác — ở đây dùng chung 1 route nên phải so `currentUser.id === profile.id`).
 *
 * `courses`/`wishlist` là `null` (không phải mảng rỗng) khi chủ tài khoản đã ẩn mục đó — 2
 * trạng thái RIÊNG cần phân biệt: "đã ẩn" khác "công khai nhưng chưa có gì".
 */
export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = Number(params.userId);
  const { data: profile, isLoading, error } = usePublicProfile(userId);
  const { data: currentUser } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('courses');

  if (isLoading) return <div className="shell py-10 text-center text-sm text-ink-muted">Đang tải...</div>;

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="shell py-10 text-center text-sm text-ink-muted">
        {notFound ? 'Không tìm thấy người dùng này.' : 'Không tải được hồ sơ, thử lại sau.'}
      </div>
    );
  }
  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;
  const activeCourses = tab === 'courses' ? profile.courses : profile.wishlist;

  return (
    <div>
      <div className="border-b border-line-soft bg-surface">
        <div className="shell py-8">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">
            {profile.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}
          </span>
          <h1 className="font-display text-3xl font-bold text-ink">{profile.fullName}</h1>
        </div>
      </div>

      <div className="shell grid gap-10 py-8 lg:grid-cols-[1fr_280px]">
        <div>
          {/* Tab kiểu Udemy — thay vì 2 mục xếp chồng như bản đầu tiên */}
          <div className="mb-6 flex gap-6 border-b border-line-soft">
            <TabButton label="Đã học" active={tab === 'courses'} onClick={() => setTab('courses')} />
            <TabButton label="Yêu thích" active={tab === 'wishlist'} onClick={() => setTab('wishlist')} />
          </div>

          {activeCourses === null ? (
            <p className="text-sm text-ink-muted">Học viên này đã ẩn mục này.</p>
          ) : activeCourses.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {tab === 'courses' ? 'Chưa sở hữu khóa học nào.' : 'Chưa lưu khóa học yêu thích nào.'}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {activeCourses.map((course) => (
                <PublicCourseCard key={course.courseId} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Cột phải — avatar + nút, đứng sticky giống khối bên phải trang Udemy */}
        <div className="h-fit lg:sticky lg:top-24">
          <div className="card flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-accent/10 font-display text-4xl font-bold text-accent-dark">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={profile.fullName} width={112} height={112} className="h-full w-full object-cover" />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            {/* (14/09/2026, sửa lỗi) — chỉ điều hướng tới trang Hồ sơ cá nhân, KHÔNG kèm
                `?edit=1` nữa (trước đây tự bật popup chỉnh sửa ngay khi vào trang, gây khó chịu
                — `?edit=1` giờ chỉ còn dùng bởi link "tên" ở dropdown Header, nơi hành vi tự mở
                popup là chủ đích ban đầu). */}
            {isOwnProfile && (
              <Link
                href="/profile"
                className="w-full rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/5 no-underline"
              >
                Hồ sơ cá nhân
              </Link>
            )}
            <p className="text-xs text-ink-muted">
              Thành viên từ {new Date(profile.memberSince).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
        active ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function PublicCourseCard({ course }: { course: PublicCourseSummary }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card-interactive flex flex-col overflow-hidden no-underline hover:no-underline"
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt={course.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="rounded-full bg-ink/35 px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/85">
              ảnh bìa khoá học
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="line-clamp-2 min-h-[38px] font-display text-sm font-semibold leading-snug text-ink">
          {course.title}
        </span>
        <StarRating rating={course.avgRating} reviewCount={course.reviewCount} />
        <span className="mt-1 font-display text-[15px] font-bold text-ink">
          {course.isFree ? 'Miễn phí' : formatPrice(course.price)}
        </span>
      </div>
    </Link>
  );
}
