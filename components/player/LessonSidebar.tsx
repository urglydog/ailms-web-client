'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Circle, CircleCheck, CirclePlay, Lock, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDuration } from '@/lib/format';
import { detectOutlineLang, lessonLabel, sectionLabel } from '@/lib/course/outlineLabel';
import type { ChapterNav } from '@/types/domain';
import type { InstructorMaterial } from '@/lib/api/materials';
import type { CourseResource } from '@/lib/api/courseResourcesApi';

/**
 * Tab "Bài giảng" của sidebar trang học — UC21/22 (UDEMY_LAYOUT_ANALYSIS mục 5).
 *
 * Mỗi chương là một accordion: tiêu đề + "đã xong/tổng · thời lượng"; chương chứa bài đang học mở sẵn.
 * Mỗi bài: biểu tượng trạng thái (đã xong / đang học / chưa học / khóa), tên, thời lượng, kẹp giấy nếu có
 * tài liệu. Đánh dấu hoàn thành CHỈ HIỂN THỊ: BE chưa có API đánh dấu tay, tiến độ tự ghi nhận khi xem
 * (BR-PROGRESS). Bài bị khóa (chưa sở hữu, không phải bài xem thử) hiện ổ khóa và không có liên kết.
 */

interface LessonSidebarProps {
  chapters: ChapterNav[];
  currentLessonId: number;
  officialMaterials?: InstructorMaterial[];
  /** Tài liệu đính kèm của CẢ khóa — lọc theo `lessonId` để biết bài nào có tài liệu riêng. */
  resources?: CourseResource[];
  /** Mã/nhãn ngôn ngữ gốc của khóa — quyết định nhãn "Phần/Bài" hay "Section/Lesson". */
  sourceLanguage?: string | null;
  /** false = chưa sở hữu khóa: bài không phải Preview bị khóa. Mặc định true. */
  enrolled?: boolean;
}

export function LessonSidebar({
  chapters,
  currentLessonId,
  officialMaterials = [],
  resources = [],
  sourceLanguage,
  enrolled = true,
}: LessonSidebarProps) {
  const t = useTranslations('learn.sidebar');
  const lang = detectOutlineLang(
    sourceLanguage,
    chapters.flatMap((c) => [c.chapterTitle, ...c.lessons.map((l) => l.lessonTitle)]),
  );
  const currentChapterId =
    chapters.find((c) => c.lessons.some((l) => l.lessonId === currentLessonId))?.chapterId ?? chapters[0]?.chapterId;
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set(currentChapterId != null ? [currentChapterId] : []));
  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Số bài đếm liên tục xuyên suốt khóa: số bài đầu của mỗi phần = tổng số bài các phần trước + 1.
  let lessonsBefore = 0;

  return (
    <div className="flex flex-col">
      {chapters.map((chapter, chapterIdx) => {
        const offset = lessonsBefore;
        lessonsBefore += chapter.lessons.length;
        const isOpen = openIds.has(chapter.chapterId);
        const done = chapter.lessons.filter((l) => l.isCompleted).length;
        const totalSec = chapter.lessons.reduce((s, l) => s + (l.durationSec || 0), 0);
        const panelId = `chapter-panel-${chapter.chapterId}`;
        return (
          <div key={chapter.chapterId} className="border-b border-line-soft last:border-b-0">
            <h3 className="m-0">
              <button
                type="button"
                onClick={() => toggle(chapter.chapterId)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-start gap-2 bg-surface px-4 py-3 text-left hover:bg-tint"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">
                    {sectionLabel(lang, chapterIdx + 1, chapter.chapterTitle)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-muted">
                    {t('chapterStats', { done, total: chapter.lessons.length, duration: formatDuration(totalSec) })}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  aria-hidden
                  className={`mt-0.5 shrink-0 text-ink-muted transition-transform duration-base motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            <ul id={panelId} hidden={!isOpen} className="m-0 list-none p-1">
              {chapter.lessons.map((lesson, lessonIdx) => {
                const isActive = lesson.lessonId === currentLessonId;
                const isLocked = !enrolled && !lesson.isPreview && !isActive;
                const hasAttachments =
                  resources.some((r) => r.lessonId === lesson.lessonId) ||
                  officialMaterials.some((m) =>
                    m.assignments?.some((a) => a.lessonId === lesson.lessonId || a.chapterId === chapter.chapterId),
                  );
                const icon = isLocked ? (
                  <Lock size={16} aria-label={t('locked')} className="mt-0.5 shrink-0 text-ink-faint" />
                ) : lesson.isCompleted ? (
                  <CircleCheck size={18} aria-label={t('completed')} className="mt-0.5 shrink-0 text-success" />
                ) : isActive ? (
                  <CirclePlay size={18} aria-label={t('current')} className="mt-0.5 shrink-0 text-accent" />
                ) : (
                  <Circle size={18} aria-label={t('notStarted')} className="mt-0.5 shrink-0 text-ink-faint" />
                );
                const body = (
                  <>
                    {icon}
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] leading-snug ${isActive ? 'font-semibold text-ink' : isLocked ? 'text-ink-muted' : 'text-ink'}`}>
                        {lessonLabel(lang, offset + lessonIdx + 1, lesson.lessonTitle)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                        {formatDuration(lesson.durationSec)}
                        {hasAttachments && (
                          <Paperclip size={11} aria-label={t('hasAttachments')} className="shrink-0 text-ink-muted" />
                        )}
                      </span>
                    </span>
                  </>
                );
                const rowClass = `flex items-start gap-2.5 rounded-md px-3 py-2 ${isActive ? 'bg-tint shadow-[inset_3px_0_0_rgb(var(--c-accent))]' : ''}`;
                return (
                  <li key={lesson.lessonId}>
                    {isLocked ? (
                      <div className={`${rowClass} cursor-not-allowed`}>{body}</div>
                    ) : (
                      <Link
                        href={`/learn/${lesson.lessonId}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`${rowClass} no-underline transition-colors duration-fast hover:bg-tint hover:no-underline`}
                      >
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
