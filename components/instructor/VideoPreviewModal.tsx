'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import type { LessonEditItem } from '@/types/domain';

/** "Xem trước — Với tư cách là Giảng viên" (19/09/2026, mở rộng — giao diện tham khảo Udemy):
 * xem lại đúng video vừa tải lên/dán link, KHÔNG rời khỏi trang chỉnh sửa — khác "Với tư cách là
 * học viên" (mở nguyên trang xem trước cả khóa học ở tab mới, xem `LessonEditorRow.tsx`). */
export function VideoPreviewModal({ lesson, onClose }: { lesson: LessonEditItem; onClose: () => void }) {
  const t = useTranslations('instructor.videoPreview');
  return (
    <Modal open onClose={onClose} title={t('title', { title: lesson.title })} size="lg">
      <div className="-mx-6 -mb-6 aspect-video bg-black">
        {lesson.videoSource === 'YOUTUBE' && lesson.youtubeId ? (
          <iframe
            key={lesson.youtubeId}
            src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
            title={t('title', { title: lesson.title })}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : lesson.videoUrl ? (
          <video key={lesson.videoUrl} controls autoPlay src={lesson.videoUrl} className="h-full w-full" />
        ) : null}
      </div>
    </Modal>
  );
}
