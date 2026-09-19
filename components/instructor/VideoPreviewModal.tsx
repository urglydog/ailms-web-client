'use client';

import type { LessonEditItem } from '@/types/domain';

/** "Xem trước — Với tư cách là Giảng viên" (19/09/2026, mở rộng — giao diện tham khảo Udemy):
 * xem lại đúng video vừa tải lên/dán link, KHÔNG rời khỏi trang chỉnh sửa — khác "Với tư cách là
 * học viên" (mở nguyên trang xem trước cả khóa học ở tab mới, xem `LessonEditorRow.tsx`). */
export function VideoPreviewModal({ lesson, onClose }: { lesson: LessonEditItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <h2 className="min-w-0 truncate font-display text-base font-bold text-gray-900">
            Xem trước — {lesson.title}
          </h2>
          <button type="button" onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          {lesson.videoSource === 'YOUTUBE' && lesson.youtubeId ? (
            <iframe
              key={lesson.youtubeId}
              src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
              title={`Xem trước — ${lesson.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : lesson.videoUrl ? (
            <video key={lesson.videoUrl} controls autoPlay src={lesson.videoUrl} className="h-full w-full" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
