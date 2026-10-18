'use client';

import { useTranslations } from 'next-intl';
import { useModerationLessonDocuments } from '@/hooks/useCourses';
import { formatFileSize } from '@/lib/format';
import type { LessonEditItem } from '@/types/domain';

interface AdminLessonPreviewProps {
  lesson: LessonEditItem;
}

/**
 * BR-COURSE-06 — Admin xem trực tiếp video gốc + tài liệu đính kèm của bài học đang chờ duyệt,
 * không cần sở hữu khóa học (BR-ENROLL-02 chỉ áp dụng cho Học viên/Guest). Mở ra khi bấm vào
 * hàng bài học trong trang duyệt (`admin/moderation/[id]`).
 */
export function AdminLessonPreview({ lesson }: AdminLessonPreviewProps) {
  const t = useTranslations('admin.moderation.lesson');
  const { data: documents, isLoading, error } = useModerationLessonDocuments(lesson.id);
  const docs = documents ?? [];

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-lg bg-surface p-3">
      {lesson.videoUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {lesson.videoSource === 'YOUTUBE' && lesson.youtubeId ? (
            <iframe
              key={lesson.youtubeId}
              src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
              title={t('videoTitle', { title: lesson.title })}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <video key={lesson.videoUrl} controls src={lesson.videoUrl} className="h-full w-full" />
          )}
        </div>
      ) : (
        <p className="m-0 text-[12px] text-ink-muted">{t('noVideo')}</p>
      )}

      <div>
        <span className="text-[12px] font-bold text-ink">{t('documents')}</span>
        {isLoading && <p className="m-0 mt-1 text-[12px] text-ink-muted">{t('loading')}</p>}
        {error && <p className="m-0 mt-1 text-[12px] text-danger">{t('docsError')}</p>}
        {!isLoading && !error && docs.length === 0 && <p className="m-0 mt-1 text-[12px] text-ink-muted">{t('noDocs')}</p>}
        {docs.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5 text-[12px]">
                <span className="min-w-0 flex-1 truncate text-ink">{doc.fileName}</span>
                <span className="shrink-0 text-ink-muted">{formatFileSize(doc.fileSize)}</span>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 font-bold text-accent-dark hover:underline">
                  {t('view')}
                </a>
                <a href={doc.fileUrl} download className="shrink-0 font-bold text-accent-dark hover:underline">
                  {t('download')}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
