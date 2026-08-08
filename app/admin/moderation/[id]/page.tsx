'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminLessonPreview } from '@/components/admin/AdminLessonPreview';
import { RejectReasonModal } from '@/components/admin/RejectReasonModal';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { useApproveCourse, useModerationDetail, useRejectCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';

export default function AdminModerationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<number>>(new Set());

  const toggleLesson = (lessonId: number) => {
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const { data: course, isLoading, error } = useModerationDetail(courseId);
  const approve = useApproveCourse();
  const reject = useRejectCourse();

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>;
  }

  if (error || !course) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error instanceof ApiError ? error.message : 'Không tìm thấy khóa học.'}
      </div>
    );
  }

  const sortedChapters = [...course.chapters].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/moderation" className="text-[13px] font-semibold text-gray-500 no-underline hover:text-gray-700">
            ← Quay lại
          </Link>
          <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">{course.title}</h1>
          <CourseStatusBadge status={course.status} />
        </div>
        {course.status === 'PENDING' && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="rounded-full border border-red-200 px-5 py-[11px] text-[13.5px] font-bold text-red-600 hover:bg-red-50"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={approve.isPending}
              onClick={() => approve.mutate(courseId)}
              className="rounded-full bg-green-600 px-5 py-[11px] text-[13.5px] font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Phê duyệt
            </button>
          </div>
        )}
      </div>

      {(approve.error instanceof ApiError || reject.error instanceof ApiError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(approve.error as ApiError | undefined)?.message ?? (reject.error as ApiError | undefined)?.message}
        </div>
      )}

      {course.status === 'REJECTED' && course.rejectReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          <span className="font-bold">Lý do đã từ chối: </span>
          {course.rejectReason}
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            {course.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnailUrl} alt={course.title} className="mb-3 h-40 w-full rounded-lg object-cover" />
            )}
            <p className="whitespace-pre-line text-[13.5px] text-gray-700">{course.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[15px] font-bold text-gray-900">Nội dung khóa học</h2>
            {sortedChapters.map((chapter) => (
              <div key={chapter.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <span className="font-display text-[13.5px] font-bold text-gray-900">{chapter.title}</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {[...chapter.lessons]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((lesson) => {
                      const isExpanded = expandedLessonIds.has(lesson.id);
                      return (
                        <div key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => toggleLesson(lesson.id)}
                            className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-[12.5px] text-gray-600 hover:bg-gray-100"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                lesson.status === 'READY' ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                            <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                            {lesson.isPreview && (
                              <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                                Preview
                              </span>
                            )}
                            <span aria-hidden className="shrink-0 text-gray-400">
                              {isExpanded ? '▾' : '▸'}
                            </span>
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

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <InfoRow label="Giảng viên" value={course.instructorName} />
          <InfoRow label="Danh mục" value={course.categoryName} />
          <InfoRow label="Trình độ" value={course.level} />
          <InfoRow label="Giá" value={course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`} />
          <InfoRow label="Số lần đã gửi lại" value={`${course.resubmitCount}/5`} />
        </div>
      </div>

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
      <span className="text-[11.5px] font-semibold text-gray-400">{label}</span>
      <span className="text-[13px] font-semibold text-gray-800">{value}</span>
    </div>
  );
}
