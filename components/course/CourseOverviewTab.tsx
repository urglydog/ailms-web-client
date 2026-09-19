'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import { StarRating } from '@/components/ui/StarRating';
import { useCourseAnnouncements, useStartConversationAsStudent } from '@/hooks/useCommunication';
import type { CourseSummary } from '@/types/domain';

const LEVEL_LABEL: Record<CourseSummary['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

/**
 * F-học liệu mở rộng (06/09/2026) — tab "Tổng quan" dưới video, tham khảo Udemy: mô tả khóa học +
 * thông tin giảng viên + số liệu (đánh giá, trình độ, số bài) ngay dưới video, không cần rời trang
 * bài học sang trang chi tiết khóa học mới xem được.
 *
 * Gọi lại NGUYÊN VẸN `publicCoursesApi.getBySlug` đã dùng ở trang chi tiết khóa học
 * (`app/(public)/courses/[slug]/page.tsx`) — không thêm field/endpoint mới ở be/, dữ liệu này vốn
 * đã công khai và không đổi theo từng bài học nên tận dụng lại được toàn bộ.
 */
export function CourseOverviewTab({
  courseSlug,
  courseId,
  enrolled = false,
}: {
  courseSlug: string;
  /** (19/09/2026) — cần cho "Thông báo" + "Nhắn tin giảng viên", chỉ hiện khi ĐÃ sở hữu khóa. */
  courseId?: number;
  enrolled?: boolean;
}) {
  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', 'public', courseSlug],
    queryFn: () => publicCoursesApi.getBySlug(courseSlug),
  });

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Đang tải...</p>;
  }

  if (!course) {
    return <p className="text-sm text-ink-muted">Không tải được thông tin khóa học.</p>;
  }

  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="mb-2 font-display text-lg font-bold text-ink">{course.title}</h2>
        <StarRating rating={course.avgRating} reviewCount={course.reviewCount} levelLabel={LEVEL_LABEL[course.level]} />
      </div>

      <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-muted">{course.description}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm text-ink-muted">
        <span>{course.chapters.length} chương · {totalLessons} bài giảng</span>
        <span>Có thể lồng tiếng sang {course.langs.length} ngôn ngữ</span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-base font-bold text-accent">
            {course.instructorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Giảng viên</p>
            <p className="text-sm font-semibold text-ink">{course.instructorName}</p>
          </div>
        </div>
        {enrolled && courseId && <MessageInstructorButton courseId={courseId} />}
      </div>

      {enrolled && courseId && <CourseAnnouncementsList courseId={courseId} />}
    </div>
  );
}

/** "Nhắn tin cho giảng viên" (19/09/2026, tính năng mới) — bắt đầu/tìm lại hội thoại với giảng
 * viên của khóa này rồi chuyển sang hộp thư chung `/messages`. */
function MessageInstructorButton({ courseId }: { courseId: number }) {
  const router = useRouter();
  const startConversation = useStartConversationAsStudent();

  return (
    <button
      type="button"
      disabled={startConversation.isPending}
      onClick={() =>
        startConversation.mutate(courseId, {
          onSuccess: (conversation) => router.push(`/messages?conversationId=${conversation.id}`),
        })
      }
      className="shrink-0 rounded-full border border-accent/30 px-3.5 py-2 text-[12.5px] font-bold text-accent hover:bg-accent/10"
    >
      Nhắn tin giảng viên
    </button>
  );
}

function CourseAnnouncementsList({ courseId }: { courseId: number }) {
  const { data: announcements, isLoading } = useCourseAnnouncements(courseId, true);

  if (isLoading || !announcements || announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Thông báo từ giảng viên</p>
      {announcements.slice(0, 3).map((a) => (
        <div key={a.id} className="rounded-lg bg-surface-hover p-3">
          <div className="mb-0.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-ink">{a.title}</span>
            <span className="shrink-0 text-[11px] text-ink-faint">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <p className="whitespace-pre-line text-[12.5px] text-ink-muted">{a.content}</p>
        </div>
      ))}
    </div>
  );
}
