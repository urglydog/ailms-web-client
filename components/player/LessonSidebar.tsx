'use client';

import Link from 'next/link';
import { formatDuration } from '@/lib/format';
import type { ChapterNav } from '@/types/domain';

/**
 * "Trong khoá học này" — UC21/22. Chỉ hiển thị khi đã đăng nhập (đã ghi danh, hoặc bài Preview
 * — {@link ChapterNav} rỗng ở luồng ẩn danh, xem `learn/[lessonId]/page.tsx`).
 *
 * Không cần khoá bài như `ChapterAccordion` (trang chi tiết khoá học): học viên đang ở đây tức
 * đã qua {@code EnrollmentSecurity.canAccessLesson}, nên mọi bài trong danh sách đều xem được.
 */

interface LessonSidebarProps {
  chapters: ChapterNav[];
  currentLessonId: number;
}

export function LessonSidebar({ chapters, currentLessonId }: LessonSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      {chapters.map((chapter) => (
        <div key={chapter.chapterId}>
          <h3 className="mb-2 text-[13px] font-semibold text-ink-muted">{chapter.chapterTitle}</h3>
          <ul className="flex flex-col gap-1">
            {chapter.lessons.map((lesson) => {
              const isActive = lesson.lessonId === currentLessonId;
              return (
                <li key={lesson.lessonId}>
                  <Link
                    href={`/learn/${lesson.lessonId}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline hover:bg-surface-raised hover:no-underline ${
                      isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-ink'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        lesson.isCompleted
                          ? 'bg-success text-white'
                          : isActive
                            ? 'bg-accent text-white'
                            : 'bg-line-soft text-ink-faint'
                      }`}
                    >
                      {lesson.isCompleted ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.lessonTitle}</span>
                    <span className="shrink-0 font-mono text-xs text-ink-faint">
                      {formatDuration(lesson.durationSec)}
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
