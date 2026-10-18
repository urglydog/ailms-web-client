'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminLessonPreview } from '@/components/admin/AdminLessonPreview';
import { RejectReasonModal } from '@/components/admin/RejectReasonModal';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApproveCourse, useModerationDetail, useRejectCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/shop/money';

/** Chi tiết khóa chờ duyệt: xem mô tả, nội dung từng bài (video gốc + tài liệu) rồi Phê duyệt (có xác nhận) hoặc Từ chối (có lý do). */
export default function AdminModerationDetailPage() {
  const t = useTranslations('admin.moderation.detail');
  const tLevel = useTranslations('courseList.level');
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<number>>(new Set());

  const toggleLesson = (lessonId: number) => {
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const { data: course, isLoading, error } = useModerationDetail(courseId);
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-sm text-danger">
        {error instanceof ApiError ? error.message : t('notFound')}
      </div>
    );
  }

  const sortedChapters = [...course.chapters].sort((a, b) => a.displayOrder - b.displayOrder);
  const actionError = (approve.error instanceof ApiError ? approve.error : null) ?? (reject.error instanceof ApiError ? reject.error : null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href="/admin/moderation" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted no-underline hover:text-ink">
            <ArrowLeft size={15} aria-hidden />
            {t('back')}
          </Link>
          <h1 className="m-0 min-w-0 font-display text-[20px] font-bold text-ink">{course.title}</h1>
          <CourseStatusBadge status={course.status} />
        </div>
        {course.status === 'PENDING' && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="rounded-full border border-danger/50 bg-white px-5 py-2.5 text-[13.5px] font-bold text-danger hover:bg-danger/5"
            >
              {t('reject')}
            </button>
            <button
              type="button"
              disabled={approve.isPending}
              onClick={() => setShowApprove(true)}
              className="rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {t('approve')}
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">
          {actionError.message}
        </div>
      )}

      {course.status === 'REJECTED' && course.rejectReason && (
        <div role="note" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-ink">
          <span className="font-bold text-danger">{t('rejectedReason')} </span>
          {course.rejectReason}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            {course.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnailUrl} alt={course.title} className="mb-3 h-40 w-full rounded-lg object-cover" />
            )}
            <p className="m-0 whitespace-pre-line text-[13.5px] text-ink">{course.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[15px] font-bold text-ink">{t('content')}</h2>
            {sortedChapters.map((chapter) => (
              <div key={chapter.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <span className="font-display text-[13.5px] font-bold text-ink">{chapter.title}</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {[...chapter.lessons]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((lesson) => {
                      const isExpanded = expandedLessonIds.has(lesson.id);
                      return (
                        <div key={lesson.id}>
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleLesson(lesson.id)}
                            className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-[12.5px] text-ink-muted hover:bg-surface"
                          >
                            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${lesson.status === 'READY' ? 'bg-success' : 'bg-line'}`} />
                            <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                            {lesson.isPreview && (
                              <span className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-[10px] font-bold text-accent-dark">{t('previewTag')}</span>
                            )}
                            {isExpanded ? <ChevronDown size={14} aria-hidden className="shrink-0" /> : <ChevronRight size={14} aria-hidden className="shrink-0" />}
                          </button>
                          {isExpanded && <AdminLessonPreview lesson={lesson} />}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex h-fit flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm lg:order-2">
          <InfoRow label={t('info.instructor')} value={course.instructorName} />
          <InfoRow label={t('info.category')} value={course.categoryName} />
          <InfoRow label={t('info.level')} value={tLevel(course.level)} />
          <InfoRow label={t('info.price')} value={course.isFree ? t('info.free') : formatMoney(course.price, locale)} />
          <InfoRow label={t('info.resubmits')} value={`${course.resubmitCount}/5`} />
        </div>
      </div>

      <ConfirmDialog
        open={showApprove}
        tone="primary"
        title={t('approveConfirm.title')}
        body={t('approveConfirm.body', { title: course.title })}
        confirmLabel={t('approve')}
        cancelLabel={t('cancel')}
        onConfirm={() => {
          setShowApprove(false);
          approve.mutate(courseId);
        }}
        onCancel={() => setShowApprove(false)}
      />

      {showRejectModal && (
        <RejectReasonModal
          courseTitle={course.title}
          isSubmitting={reject.isPending}
          onClose={() => setShowRejectModal(false)}
          onConfirm={(reason) => {
            reject.mutate(
              { id: courseId, input: { reason } },
              {
                onSuccess: () => {
                  setShowRejectModal(false);
                  router.push('/admin/moderation');
                },
              },
            );
          }}
        />
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11.5px] font-semibold text-ink-muted">{label}</span>
      <span className="text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}
