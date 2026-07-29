'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Chapter } from '@/types/domain';

/**
 * Danh sách chương/bài dạng accordion cho trang chi tiết khoá học (UC10).
 *
 * Quyền truy cập theo BR-ENROLL-02:
 *  - Bài `isPreview` → ai cũng xem được video (tối đa 2 bài/khoá), nhưng KHÔNG
 *    dùng được AI Tutor / Quiz / Flashcards.
 *  - Bài còn lại → chỉ học viên đã sở hữu khoá học, hiện icon khoá.
 */

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface ChapterAccordionProps {
  chapters: Chapter[];
  /** Người dùng hiện tại đã sở hữu khoá học chưa (BR-ENROLL-01). */
  enrolled: boolean;
}

export function ChapterAccordion({ chapters, enrolled }: ChapterAccordionProps) {
  // Mở chương đầu tiên sẵn để người xem thấy ngay cấu trúc bài học
  const [openIds, setOpenIds] = useState<number[]>(() =>
    chapters[0] ? [chapters[0].id] : [],
  );

  const toggle = (id: number) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-3">
      {chapters.map((chapter) => {
        const isOpen = openIds.includes(chapter.id);
        const totalSec = chapter.lessons.reduce((sum, l) => sum + l.durationSec, 0);

        return (
          <div key={chapter.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(chapter.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-[15px] font-semibold text-ink">{chapter.title}</span>
              <span className="flex shrink-0 items-center gap-3 text-[13px] text-ink-muted">
                <span>
                  {chapter.lessons.length} bài · {formatDuration(totalSec)}
                </span>
                <span aria-hidden className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
                  ▾
                </span>
              </span>
            </button>

            {isOpen && (
              <ul className="border-t border-line-soft">
                {chapter.lessons.map((lesson) => {
                  const accessible = enrolled || lesson.isPreview;

                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3 last:border-b-0"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span aria-hidden className="text-ink-faint">
                          {accessible ? '▶' : '🔒'}
                        </span>
                        {accessible ? (
                          <Link
                            href={`/learn/${lesson.id}`}
                            className="truncate text-sm font-medium no-underline"
                          >
                            {lesson.title}
                          </Link>
                        ) : (
                          <span className="truncate text-sm text-ink-muted">{lesson.title}</span>
                        )}
                        {lesson.isPreview && (
                          <Badge tone="accent" className="shrink-0">
                            Học thử
                          </Badge>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-ink-faint">
                        {formatDuration(lesson.durationSec)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
