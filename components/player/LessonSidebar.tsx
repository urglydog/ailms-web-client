'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Download, Play } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { getFileVisual } from '@/lib/resourceFileVisual';
import type { ChapterNav } from '@/types/domain';
import type { InstructorMaterial } from '@/lib/api/materials';
import type { CourseResource } from '@/lib/api/courseResourcesApi';

/**
 * "Trong khoá học này" — UC21/22. Chỉ hiển thị khi đã đăng nhập (đã ghi danh, hoặc bài Preview
 * — {@link ChapterNav} rỗng ở luồng ẩn danh, xem `learn/[lessonId]/page.tsx`).
 *
 * Không cần khoá bài như `ChapterAccordion` (trang chi tiết khoá học): học viên đang ở đây tức
 * đã qua {@code EnrollmentSecurity.canAccessLesson}, nên mọi bài trong danh sách đều xem được.
 *
 * (20/09/2026, thiết kế lại — giao diện tham khảo Udemy) — trước đây mỗi dòng chỉ có tên bài +
 * thời lượng nằm cùng 1 hàng, KHÔNG hiển thị tài liệu đính kèm mà Giảng viên đã gắn riêng cho
 * từng bài (đã có sẵn ở trang tạo khóa học, chỉ chưa lộ ra phía học viên). Giờ mỗi dòng: tên bài
 * ở trên, thời lượng góc trái bên dưới; nếu bài có tài liệu đính kèm thì thêm nút "Tài nguyên ▾"
 * bên phải, bấm vào xổ ra danh sách tải xuống ngay tại chỗ — không cần rời sang tab "Tài nguyên"
 * riêng (tab đó vẫn giữ, gộp tài liệu của CẢ khóa cho ai muốn xem tổng hợp).
 */

interface LessonSidebarProps {
  chapters: ChapterNav[];
  currentLessonId: number;
  officialMaterials?: InstructorMaterial[];
  /** Tài liệu đính kèm của CẢ khóa — lọc theo `lessonId` để biết bài nào có tài liệu riêng. */
  resources?: CourseResource[];
}

export function LessonSidebar({ chapters, currentLessonId, officialMaterials = [], resources = [] }: LessonSidebarProps) {
  const [openResourcesForLessonId, setOpenResourcesForLessonId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {chapters.map((chapter) => (
        <div key={chapter.chapterId}>
          <h3 className="mb-2 text-[13px] font-semibold text-ink-muted">{chapter.chapterTitle}</h3>
          <ul className="flex flex-col gap-1">
            {chapter.lessons.map((lesson) => {
              const isActive = lesson.lessonId === currentLessonId;
              const lessonResources = resources.filter((r) => r.lessonId === lesson.lessonId);
              const isResourcesOpen = openResourcesForLessonId === lesson.lessonId;

              return (
                <li key={lesson.lessonId} className="flex flex-col">
                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 ${isActive ? 'bg-accent/10' : 'hover:bg-surface-raised'}`}>
                    <Link
                      href={`/learn/${lesson.lessonId}`}
                      className="flex min-w-0 flex-1 items-start gap-2.5 no-underline hover:no-underline"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                          lesson.isCompleted
                            ? 'bg-success text-white'
                            : isActive
                              ? 'bg-accent text-white'
                              : 'bg-line-soft text-ink-faint'
                        }`}
                      >
                        {lesson.isCompleted ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${isActive ? 'font-semibold text-accent' : 'text-ink'}`}>
                          {lesson.lessonTitle}

                          {officialMaterials.some(m => m.assignments?.some(a => a.lessonId === lesson.lessonId || a.chapterId === chapter.chapterId)) && (
                            <span title="Có bài tập/học liệu đính kèm" className="ml-1.5 text-[10px] text-ink-muted">📎</span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                          <Play className="h-3 w-3 shrink-0" fill="currentColor" strokeWidth={0} />
                          {formatDuration(lesson.durationSec)}
                        </span>
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setOpenResourcesForLessonId(isResourcesOpen ? null : lesson.lessonId)}
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isResourcesOpen
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-line text-ink-muted hover:border-accent hover:text-accent'
                      }`}
                    >
                      Tài nguyên
                      <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isResourcesOpen && (
                    <div className="mb-1 ml-8 mt-1 flex flex-col gap-1 rounded-lg border border-line-soft bg-surface-hover p-1.5">
                      {lessonResources.length === 0 ? (
                        <p className="px-2 py-1.5 text-[12px] text-ink-faint">Chưa có tài liệu đính kèm cho bài này.</p>
                      ) : (
                        lessonResources.map((res) => {
                          const { Icon, bg, text } = getFileVisual(res.fileType);
                          return (
                            <a
                              key={res.id}
                              href={res.fileUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] no-underline hover:bg-white hover:no-underline"
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${bg} ${text}`}>
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-ink" title={res.title}>{res.title}</span>
                              <Download className="h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} />
                            </a>
                          );
                        })
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
