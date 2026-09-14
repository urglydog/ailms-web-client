'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLessonPlayer } from '@/hooks/usePublicCourses';
import type { LessonSummary } from '@/types/domain';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * "Preview this course" kiểu Udemy (14/09/2026, mở rộng ngoài đặc tả gốc — UC11 vốn chỉ có
 * "Học thử miễn phí" điều hướng sang trang `/learn/{lessonId}` RIÊNG, không có modal xem ngay
 * tại trang chi tiết). Bấm thumbnail mở modal phát TOÀN BỘ bài Preview theo đúng thứ tự
 * chương-bài (không chỉ 1 bài đầu tiên như nút "Học thử miễn phí" cũ), danh sách bên dưới video
 * đánh dấu bài đang phát bằng icon ▶.
 *
 * Dùng `<video controls>`/iframe YouTube gốc thay vì `DualPlayer` — `DualPlayer` được thiết kế
 * cho luồng học có ghi nhận tiến độ + chọn track lồng tiếng (sở hữu bởi trang `/learn`), không
 * hợp với 1 modal preview đơn giản trước khi mua; điều khiển gốc của trình duyệt/YouTube đã có
 * sẵn thời gian phát, tốc độ, phụ đề (CC), toàn màn hình — đúng yêu cầu "settings phù hợp" mà
 * không cần dựng lại player riêng.
 */
export function CoursePreview({
  thumbnailUrl,
  courseTitle,
  previewLessons,
}: {
  thumbnailUrl: string | null;
  courseTitle: string;
  previewLessons: LessonSummary[];
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasPreview = previewLessons.length > 0;
  const activeLesson = previewLessons[activeIndex];

  const { data: player, isLoading } = useLessonPlayer(activeLesson?.id ?? -1, { enabled: open && !!activeLesson });

  useEffect(() => {
    if (!open) setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const playNext = () => {
    if (activeIndex < previewLessons.length - 1) setActiveIndex(activeIndex + 1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => hasPreview && setOpen(true)}
        disabled={!hasPreview}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-t-card bg-ink disabled:cursor-default"
      >
        {thumbnailUrl && (
          <Image src={thumbnailUrl} alt={courseTitle} fill sizes="340px" className="object-cover opacity-90" />
        )}
        {hasPreview && (
          <>
            <span className="absolute inset-0 bg-ink/20 transition-colors group-hover:bg-ink/35" aria-hidden />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition-transform group-hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="absolute bottom-2 left-2 rounded bg-ink/70 px-2 py-1 text-[11px] font-semibold text-white">
              Xem trước khóa học
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Xem trước khóa học</p>
                <h3 className="truncate font-display text-sm font-bold text-ink">{courseTitle}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="shrink-0 text-xl text-ink-faint hover:text-ink">
                ×
              </button>
            </div>

            <div className="aspect-video w-full shrink-0 bg-black">
              {isLoading || !player ? (
                <div className="flex h-full items-center justify-center text-sm text-white/70">Đang tải video…</div>
              ) : player.videoSource === 'YOUTUBE' && player.youtubeId ? (
                <iframe
                  key={player.lessonId}
                  src={`https://www.youtube.com/embed/${player.youtubeId}?autoplay=1&rel=0`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title={player.lessonTitle}
                />
              ) : (
                <video
                  key={player.lessonId}
                  src={player.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full"
                  onEnded={playNext}
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {previewLessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                    index === activeIndex ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-surface'
                  }`}
                >
                  {index === activeIndex ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <span className="w-[14px] shrink-0" />
                  )}
                  <span className="flex-1 truncate font-medium">{lesson.title}</span>
                  <span className="shrink-0 text-xs text-ink-faint">{formatDuration(lesson.durationSec)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
