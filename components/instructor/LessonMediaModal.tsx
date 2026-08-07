'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  useDeleteLessonDocument,
  useLessonDocuments,
  useSetYoutubeVideo,
  useUploadLessonDocument,
  useUploadLessonVideo,
} from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import type { LessonEditItem } from '@/types/domain';

interface LessonMediaModalProps {
  courseId: number;
  lesson: LessonEditItem;
  onClose: () => void;
}

const MAX_DOCUMENTS = 5;

function formatDuration(sec: number | null): string {
  if (!sec) return '--:--';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** F4.1/F4.2 (UC34, UC35) — mở từ nút "Quản lý video" ở mỗi hàng bài học. */
export function LessonMediaModal({ courseId, lesson, onClose }: LessonMediaModalProps) {
  const [tab, setTab] = useState<'upload' | 'youtube'>(lesson.videoSource === 'YOUTUBE' ? 'youtube' : 'upload');
  const [youtubeUrl, setYoutubeUrl] = useState(lesson.videoSource === 'YOUTUBE' ? (lesson.videoUrl ?? '') : '');
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [docProgress, setDocProgress] = useState<number | null>(null);

  const uploadVideo = useUploadLessonVideo(courseId);
  const setYoutube = useSetYoutubeVideo(courseId);
  const { data: documents, isLoading: documentsLoading } = useLessonDocuments(lesson.id);
  const uploadDocument = useUploadLessonDocument(lesson.id);
  const deleteDocument = useDeleteLessonDocument(lesson.id);

  const docs = documents ?? [];

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setVideoProgress(0);
    uploadVideo.mutate(
      { lessonId: lesson.id, file, onProgress: setVideoProgress },
      { onSettled: () => setVideoProgress(null) },
    );
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
    setDocProgress(0);
    uploadDocument.mutate({ file, onProgress: setDocProgress }, { onSettled: () => setDocProgress(null) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate font-display text-lg font-bold text-gray-900">
            Quản lý video — {lesson.title}
          </h2>
          <button type="button" onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-[12.5px] text-gray-600">
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              lesson.status === 'READY'
                ? 'bg-green-50 text-green-600'
                : lesson.status === 'UNAVAILABLE'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-100 text-gray-500'
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

        <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 rounded-md py-1.5 ${tab === 'upload' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500'}`}
          >
            Tải MP4 lên
          </button>
          <button
            type="button"
            onClick={() => setTab('youtube')}
            className={`flex-1 rounded-md py-1.5 ${tab === 'youtube' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500'}`}
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
              disabled={videoProgress !== null}
              className="text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
            />
            {videoProgress !== null && <UploadProgressBar percent={videoProgress} label="Đang tải video lên..." />}
            {uploadVideo.error instanceof ApiError && (
              <p className="text-[12px] text-red-600">{uploadVideo.error.message}</p>
            )}
          </div>
        )}

        {tab === 'youtube' && (
          <form onSubmit={handleYoutubeSubmit} className="mb-5 flex flex-col gap-2">
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={setYoutube.isPending}
              className="self-start rounded-lg bg-cyan-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {setYoutube.isPending ? 'Đang kiểm tra...' : 'Lưu link YouTube'}
            </button>
            {setYoutube.error instanceof ApiError && (
              <p className="text-[12px] text-red-600">{setYoutube.error.message}</p>
            )}
          </form>
        )}

        <hr className="my-4 border-gray-100" />

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-gray-800">Tài liệu đính kèm</h3>
          <span className="text-[11.5px] text-gray-400">
            {docs.length}/{MAX_DOCUMENTS}
          </span>
        </div>

        {documentsLoading && <p className="text-[12.5px] text-gray-400">Đang tải...</p>}

        <div className="mb-3 flex flex-col gap-1.5">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate text-gray-700">{doc.fileName}</span>
              <span className="shrink-0 text-gray-400">{formatFileSize(doc.fileSize)}</span>
              <button
                type="button"
                onClick={() => deleteDocument.mutate(doc.id)}
                className="shrink-0 text-[11.5px] font-bold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          ))}
          {docs.length === 0 && !documentsLoading && (
            <p className="text-[12px] text-gray-400">Chưa có tài liệu nào.</p>
          )}
        </div>

        {docs.length < MAX_DOCUMENTS ? (
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.zip,.txt"
              onChange={handleDocFileChange}
              disabled={docProgress !== null}
              className="text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
            />
            {docProgress !== null && <UploadProgressBar percent={docProgress} label="Đang tải tài liệu lên..." />}
            {uploadDocument.error instanceof ApiError && (
              <p className="text-[12px] text-red-600">{uploadDocument.error.message}</p>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-amber-600">Đã đạt tối đa {MAX_DOCUMENTS} tài liệu — xóa bớt để thêm mới.</p>
        )}
      </div>
    </div>
  );
}
