'use client';

import Link from 'next/link';
import { Circle, CircleCheck, CirclePlay, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDuration } from '@/lib/format';
import type { ChapterNav } from '@/types/domain';
import type { InstructorMaterial } from '@/lib/api/materials';
import type { CourseResource } from '@/lib/api/courseResourcesApi';

/**
 * "Nội dung khóa học" — UC21/22. Chỉ hiển thị khi đã đăng nhập (đã ghi danh, hoặc bài Preview
 * — {@link ChapterNav} rỗng ở luồng ẩn danh, xem `learn/[lessonId]/page.tsx`).
 *
 * Không cần khoá bài như `ChapterAccordion` (trang chi tiết khoá học): học viên đang ở đây tức
 * đã qua {@code EnrollmentSecurity.canAccessLesson}, nên mọi bài trong danh sách đều xem được.
 *
 * (17/10/2026, thiết kế lại theo spec UI/UX học viên, mục 7) — bỏ nút "Tài nguyên ▾" lặp lại ở từng
 * bài: tài nguyên của khóa đã gộp vào tab "Học liệu" dưới video. Mỗi bài giờ chỉ gồm biểu tượng trạng
 * thái (đã xong / đang học / chưa học), tên bài, thời lượng, và một biểu tượng kẹp giấy nếu bài có tài
 * liệu đính kèm.
 */

interface LessonSidebarProps {
  chapters: ChapterNav[];
  currentLessonId: number;
  officialMaterials?: InstructorMaterial[];
  /** Tài liệu đính kèm của CẢ khóa — lọc theo `lessonId` để biết bài nào có tài liệu riêng. */
  resources?: CourseResource[];
}

export function LessonSidebar({ chapters, currentLessonId, officialMaterials = [], resources = [] }: LessonSidebarProps) {
  const t = useTranslations('learn.sidebar');

  return (
    <div className="flex flex-col gap-4">
      {chapters.map((chapter) => (
        <div key={chapter.chapterId}>
          <h3 className="m-0 mb-1.5 text-xs font-semibold tracking-wide text-ink-muted">{chapter.chapterTitle}</h3>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {chapter.lessons.map((lesson) => {
              const isActive = lesson.lessonId === currentLessonId;
              const hasAttachments =
                resources.some((r) => r.lessonId === lesson.lessonId) ||
                officialMaterials.some((m) =>
                  m.assignments?.some((a) => a.lessonId === lesson.lessonId || a.chapterId === chapter.chapterId),
                );

              return (
                <li key={lesson.lessonId}>
                  <Link
                    href={`/learn/${lesson.lessonId}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 no-underline transition-colors duration-150 hover:no-underline ${
                      isActive ? 'bg-tint' : 'hover:bg-tint'
                    }`}
                  >
                    {lesson.isCompleted ? (
                      <CircleCheck size={18} aria-label={t('completed')} className="mt-0.5 shrink-0 text-success" />
                    ) : isActive ? (
                      <CirclePlay size={18} aria-label={t('current')} className="mt-0.5 shrink-0 text-accent" />
                    ) : (
                      <Circle size={18} aria-label={t('notStarted')} className="mt-0.5 shrink-0 text-ink-faint" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] ${isActive ? 'font-semibold text-accent-dark' : 'text-ink'}`}>
                        {lesson.lessonTitle}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                        {formatDuration(lesson.durationSec)}
                        {hasAttachments && (
                          <Paperclip size={11} aria-label={t('hasAttachments')} className="shrink-0 text-ink-muted" />
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
