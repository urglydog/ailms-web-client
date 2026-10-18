'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CourseReferralSection } from '@/components/instructor/edit/CourseReferralSection';
import { CourseVisibilitySection } from '@/components/instructor/edit/CourseVisibilitySection';
import { EditTabs } from '@/components/instructor/edit/EditTabs';
import { EditTopbar } from '@/components/instructor/edit/EditTopbar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDeleteCourse, useMyCourseDetail, useReactivateCourse, useSubmitCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { editCompletion } from '@/lib/instructor/editNav';

/**
 * Khung chung cho các trang chỉnh sửa khóa học (thiết kế lại):
 *
 * 1. Là trang TOÀN MÀN HÌNH riêng, không nằm trong khung có thanh bên của `app/instructor/layout.tsx` (route này được
 *    layout đó bỏ qua) — chỉ bấm "Quay lại các khóa học" mới rời khỏi đây.
 * 2. Thanh trên cố định (`EditTopbar`): tên và trạng thái khóa, tiến độ hoàn thiện, Xem trước, Cài đặt và nút Gửi duyệt
 *    luôn thấy. Dưới đó là thanh tab ngang (`EditTabs`) thay cho thanh điều hướng dọc cũ.
 * 3. "Cài đặt" hiện ngay trong khung nội dung chính (thay `children`), không phải cửa sổ nổi; bấm một tab bất kỳ sẽ tự
 *    thoát Cài đặt.
 */
export function EditCourseLayout({ courseId, children }: { courseId: number; children: ReactNode }) {
  const t = useTranslations('instructor.edit');
  const pathname = usePathname();
  const { data: course, isLoading } = useMyCourseDetail(courseId);
  const submitCourse = useSubmitCourse(courseId);
  const deleteCourse = useDeleteCourse();
  const reactivateCourse = useReactivateCourse();

  const [showSettings, setShowSettings] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Rời trang qua một tab khác (curriculum/basics/...) thì tự thoát Cài đặt.
  useEffect(() => {
    setShowSettings(false);
  }, [pathname]);

  if (isLoading || !course) {
    return <div className="p-10 text-center text-sm text-ink-muted">{t('loading')}</div>;
  }

  const isLocked = course.status === 'PENDING';
  const firstLessonId = course.chapters.flatMap((c) => c.lessons)[0]?.id;

  const statusText =
    course.status === 'DRAFT'
      ? t('settings.statusDraft')
      : course.status === 'PUBLISHED'
        ? t('settings.statusPublished')
        : course.status === 'ARCHIVED'
          ? t('settings.statusArchived')
          : t('settings.statusOther');

  return (
    <div className="flex min-h-dvh flex-col bg-surface font-sans text-ink">
      <EditTopbar
        title={course.title}
        status={course.status}
        completion={editCompletion(course)}
        missing={course.missingConditions}
        canSubmit={course.canSubmit}
        submitting={submitCourse.isPending}
        settingsOpen={showSettings}
        canPreviewAsInstructor={!!firstLessonId}
        onSubmit={() => submitCourse.mutate()}
        onToggleSettings={() => setShowSettings((v) => !v)}
        onPreviewInstructor={() => firstLessonId && window.open(`/learn/${firstLessonId}`, '_blank', 'noopener,noreferrer')}
        onPreviewLearner={() => window.open(`/courses/${course.slug}`, '_blank', 'noopener,noreferrer')}
      />
      <EditTabs courseId={courseId} pathname={pathname} settingsOpen={showSettings} />

      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-6 sm:px-8 sm:py-7">
        {!showSettings && course.status === 'REJECTED' && course.rejectReason && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">
            <span className="font-bold">{t('banners.rejected')} </span>
            {course.rejectReason}
            {course.resubmitCount > 0 && <span className="ml-2">{t('banners.resubmitCount', { count: course.resubmitCount })}</span>}
          </div>
        )}

        {!showSettings && course.status === 'PUBLISHED' && (
          <div className="rounded-xl border border-highlight bg-white p-4 text-[13px] text-ink">{t('banners.published')}</div>
        )}

        {!showSettings && isLocked && (
          <div className="rounded-xl border border-line bg-tint p-4 text-[13px] text-accent-dark">{t('banners.locked')}</div>
        )}

        {!showSettings && submitCourse.error instanceof ApiError && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">
            {submitCourse.error.message}
          </div>
        )}

        {showSettings ? (
          <div className="rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line-soft px-6 py-4">
              <h2 className="m-0 font-display text-[17px] font-bold text-ink">{t('settings.title')}</h2>
            </div>

            <div className="flex flex-col gap-2 border-b border-line-soft p-6">
              <h3 className="m-0 text-[14px] font-bold text-ink">{t('settings.statusTitle')}</h3>
              <p className="m-0 text-[12.5px] text-ink-muted">{statusText}</p>

              {course.status === 'ARCHIVED' ? (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={reactivateCourse.isPending}
                    onClick={() => reactivateCourse.mutate(courseId)}
                    className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {reactivateCourse.isPending ? t('settings.reactivating') : t('settings.reactivate')}
                  </button>
                  <p className="mt-1.5 max-w-md text-[11.5px] text-ink-muted">{t('settings.reactivateHint')}</p>
                </div>
              ) : (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={deleteCourse.isPending}
                    onClick={() => setConfirmArchive(true)}
                    className="rounded-lg border border-danger/40 px-4 py-2 text-[13px] font-bold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('settings.archive')}
                  </button>
                  <p className="mt-1.5 max-w-md text-[11.5px] text-ink-muted">{t('settings.archiveHint')}</p>
                </div>
              )}
            </div>

            <CourseVisibilitySection courseId={courseId} course={course} />

            <CourseReferralSection course={course} />

            <div className="p-6 text-[12.5px] text-ink-muted">{t('settings.coInstructor')}</div>
          </div>
        ) : (
          <div className={isLocked ? 'pointer-events-none opacity-70' : ''}>{children}</div>
        )}
      </main>

      {confirmArchive && (
        <ConfirmModal
          title={t('settings.archiveConfirmTitle')}
          message={t('settings.archiveConfirmMessage')}
          confirmLabel={t('settings.archiveConfirm')}
          cancelLabel={t('settings.cancel')}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => {
            setConfirmArchive(false);
            deleteCourse.mutate(courseId);
          }}
        />
      )}
    </div>
  );
}
