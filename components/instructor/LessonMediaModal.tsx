'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  useDeleteLessonDocument,
  useDeleteLessonVideo,
  useLessonDocuments,
  useSetYoutubeVideo,
} from '@/hooks/useCourses';
import { useStartLessonDocumentUpload, useStartLessonVideoUpload } from '@/hooks/useUploadTray';
import { ApiError } from '@/lib/api/client';
import { formatDuration, formatFileSize } from '@/lib/format';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import type { LessonEditItem } from '@/types/domain';

interface LessonMediaModalProps {
  courseId: number;
  lesson: LessonEditItem;
  onClose: () => void;
}

const MAX_DOCUMENTS = 5;

/** F4.1/F4.2 (UC34, UC35) — mở từ nút "Quản lý video" ở mỗi hàng bài học. */
export function LessonMediaModal({ courseId, lesson, onClose }: LessonMediaModalProps) {
  const [tab, setTab] = useState<'upload' | 'youtube'>(lesson.videoSource === 'YOUTUBE' ? 'youtube' : 'upload');
  const [youtubeUrl, setYoutubeUrl] = useState(lesson.videoSource === 'YOUTUBE' ? (lesson.videoUrl ?? '') : '');

  const startVideoUpload = useStartLessonVideoUpload(courseId);
  const startDocumentUpload = useStartLessonDocumentUpload();
  const setYoutube = useSetYoutubeVideo(courseId);
  const deleteVideo = useDeleteLessonVideo(courseId);
  const { data: documents, isLoading: documentsLoading } = useLessonDocuments(lesson.id);
  const deleteDocument = useDeleteLessonDocument(lesson.id);

  // Đọc tiến độ từ khay tải lên toàn cục (`UploadTray`) thay vì state riêng của modal — nhờ vậy
  // tiến độ vẫn hiện đúng dù modal bị đóng rồi mở lại giữa chừng lúc đang tải.
  const videoTask = useUploadTrayStore((s) =>
    s.tasks.find((t) => t.targetType === 'lesson-video' && t.targetId === lesson.id),
  );
  const docTask = useUploadTrayStore((s) =>
    s.tasks.find((t) => t.targetType === 'lesson-document' && t.targetId === lesson.id),
  );

  const docs = documents ?? [];

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startVideoUpload(lesson.id, file, `Video: ${lesson.title}`);
  };

  const handleYoutubeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    setYoutube.mutate({ lessonId: lesson.id, input: { url: youtubeUrl.trim() } });
  };

  const handleDocFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startDocumentUpload(lesson.id, file, `Tài liệu: ${file.name}`);
  };

  const handleDeleteVideo = () => {
    deleteVideo.mutate(lesson.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate font-display text-lg font-bold text-ink">
            Quản lý video — {lesson.title}
          </h2>
          <button type="button" onClick={onClose} className="shrink-0 text-ink-faint hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-ink-muted">
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              lesson.status === 'READY'
                ? 'bg-success-tint text-success'
                : lesson.status === 'UNAVAILABLE'
                  ? 'bg-danger/5 text-danger'
                  : 'bg-tint text-ink-muted'
            }`}
          >
            {lesson.status === 'READY' ? 'Sẵn sàng' : lesson.status === 'UNAVAILABLE' ? 'Video lỗi' : 'Chưa có video'}
          </span>
          {lesson.videoSource && (
            <span>
              Nguồn: {lesson.videoSource === 'YOUTUBE' ? 'YouTube' : 'Tải lên'} · {formatDuration(lesson.durationSec)}
            </span>
          )}
        </div>

        {lesson.videoUrl && (
          <div className="mb-5 aspect-video w-full overflow-hidden rounded-lg bg-black">
            {lesson.videoSource === 'YOUTUBE' && lesson.youtubeId ? (
              <iframe
                key={lesson.youtubeId}
                src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
                title={`Xem trước video — ${lesson.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <video key={lesson.videoUrl} controls src={lesson.videoUrl} className="h-full w-full" />
            )}
          </div>
        )}

        {lesson.videoSource ? (
          <div className="mb-5 flex flex-col gap-2 rounded-lg border border-warning/30 bg-streak-bg p-3 text-[12.5px] text-streak-ink">
            <span>
              Bài học đã có video ({lesson.videoSource === 'YOUTUBE' ? 'link YouTube' : 'MP4 tải lên'}). Xóa video
              hiện tại để đổi sang nguồn khác hoặc tải video mới.
            </span>
            <button
              type="button"
              onClick={handleDeleteVideo}
              disabled={deleteVideo.isPending}
              className="self-start rounded-lg border border-danger/40 bg-white px-3 py-1.5 text-[12px] font-bold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteVideo.isPending ? 'Đang xóa...' : 'Xóa video'}
            </button>
            {deleteVideo.error instanceof ApiError && (
              <p className="text-[12px] text-danger">{deleteVideo.error.message}</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex gap-1 rounded-lg bg-tint p-1 text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={() => setTab('upload')}
                disabled={videoTask?.status === 'uploading'}
                className={`flex-1 rounded-md py-1.5 disabled:cursor-not-allowed ${tab === 'upload' ? 'bg-white text-cyan-700 shadow-sm' : 'text-ink-muted'}`}
              >
                Tải MP4 lên
              </button>
              <button
                type="button"
                onClick={() => setTab('youtube')}
                disabled={videoTask?.status === 'uploading'}
                className={`flex-1 rounded-md py-1.5 disabled:cursor-not-allowed ${tab === 'youtube' ? 'bg-white text-cyan-700 shadow-sm' : 'text-ink-muted'}`}
              >
                Dán link YouTube
              </button>
            </div>

            {tab === 'upload' && (
              <div className="mb-5 flex flex-col gap-2">
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={handleVideoFileChange}
                  disabled={videoTask?.status === 'uploading'}
                  className="text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
                />
                {videoTask?.status === 'uploading' && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <UploadProgressBar percent={videoTask.percent} label="Đang tải video lên..." />
                    </div>
                    <button
                      type="button"
                      onClick={() => useUploadTrayStore.getState().cancelTask(videoTask.id)}
                      className="shrink-0 pb-0.5 text-[11.5px] font-bold text-danger hover:text-danger"
                    >
                      Hủy
                    </button>
                  </div>
                )}
                {videoTask?.status === 'error' && (
                  <p className="text-[12px] text-danger">{videoTask.errorMessage}</p>
                )}
              </div>
            )}

            {tab === 'youtube' && (
              <form onSubmit={handleYoutubeSubmit} className="mb-5 flex flex-col gap-2">
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={setYoutube.isPending}
                  className="rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={setYoutube.isPending}
                  className="self-start rounded-lg bg-cyan-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {setYoutube.isPending ? 'Đang kiểm tra...' : 'Lưu link YouTube'}
                </button>
                {setYoutube.error instanceof ApiError && (
                  <p className="text-[12px] text-danger">{setYoutube.error.message}</p>
                )}
              </form>
            )}
          </>
        )}

        <hr className="my-4 border-line-soft" />

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-ink">Tài liệu đính kèm</h3>
          <span className="text-[11.5px] text-ink-faint">
            {docs.length}/{MAX_DOCUMENTS}
          </span>
        </div>

        {documentsLoading && <p className="text-[12.5px] text-ink-faint">Đang tải...</p>}

        <div className="mb-3 flex flex-col gap-1.5">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate text-ink">{doc.fileName}</span>
              <span className="shrink-0 text-ink-faint">{formatFileSize(doc.fileSize)}</span>
              <button
                type="button"
                onClick={() => deleteDocument.mutate(doc.id)}
                className="shrink-0 text-[11.5px] font-bold text-danger hover:text-danger"
              >
                Xóa
              </button>
            </div>
          ))}
          {docs.length === 0 && !documentsLoading && (
            <p className="text-[12px] text-ink-faint">Chưa có tài liệu nào.</p>
          )}
        </div>

        {docs.length < MAX_DOCUMENTS ? (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.zip,.txt"
              onChange={handleDocFileChange}
              disabled={docTask?.status === 'uploading'}
              className="text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
            />
            {docTask?.status === 'uploading' && (
              <UploadProgressBar percent={docTask.percent} label="Đang tải tài liệu lên..." />
            )}
            {docTask?.status === 'error' && <p className="text-[12px] text-danger">{docTask.errorMessage}</p>}
          </div>
        ) : (
          <p className="text-[12px] text-warning">Đã đạt tối đa {MAX_DOCUMENTS} tài liệu — xóa bớt để thêm mới.</p>
        )}
      </div>
    </div>
  );
}
