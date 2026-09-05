import { useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { ApiError, UploadCancelledError } from '@/lib/api/client';
import { lessonsApi } from '@/lib/api/lessons';
import { liveApi } from '@/lib/api/live';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';
import type { CourseEditDetail, LiveSession } from '@/types/domain';

/**
 * Bắt đầu upload (video/tài liệu/ảnh bìa) và đẩy tiến độ vào {@link useUploadTrayStore} —
 * TÁCH KHỎI `useMutation` có chủ đích: nếu dùng `useMutation`, callback `onProgress`/`onSuccess`
 * gắn theo vòng đời component gọi `.mutate()`, còn ở đây Promise chạy độc lập và ghi thẳng vào
 * store toàn cục qua `getState()`, nên khay tải lên vẫn cập nhật đúng dù modal đã đóng hoặc
 * người dùng đã chuyển sang bài học khác (đây chính là mục đích của khay).
 */

function newTaskId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Tải lên thất bại, thử lại sau.';
}

export function useStartLessonVideoUpload(courseId: number) {
  const queryClient = useQueryClient();

  return (lessonId: number, file: File, label: string) => {
    const id = newTaskId();
    const { promise, abort } = lessonsApi.uploadVideo(lessonId, file, (percent) =>
      useUploadTrayStore.getState().updateProgress(id, percent),
    );
    useUploadTrayStore.getState().addTask({ id, label, targetType: 'lesson-video', targetId: lessonId, abort });

    promise
      .then(() => {
        useUploadTrayStore.getState().markSuccess(id);
        queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] });
      })
      .catch((err) => {
        if (err instanceof UploadCancelledError) {
          useUploadTrayStore.getState().dismissTask(id);
          // An toàn: nếu server vừa lưu xong video ngay trước khi lệnh hủy tới nơi (hiếm, do độ
          // trễ mạng), xóa lại để không sót video mồ côi trên B2 — lỗi "chưa có video" (trường
          // hợp hủy kịp trước khi server nhận xong) bỏ qua, không phải lỗi thật.
          lessonsApi.deleteVideo(lessonId).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] });
          return;
        }
        useUploadTrayStore.getState().markError(id, toErrorMessage(err));
      });
  };
}

export function useStartLessonDocumentUpload() {
  const queryClient = useQueryClient();

  return (lessonId: number, file: File, label: string) => {
    const id = newTaskId();
    useUploadTrayStore.getState().addTask({ id, label, targetType: 'lesson-document', targetId: lessonId });

    lessonsApi
      .uploadDocument(lessonId, file, (percent) => useUploadTrayStore.getState().updateProgress(id, percent))
      .then(() => {
        useUploadTrayStore.getState().markSuccess(id);
        queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'documents'] });
      })
      .catch((err) => useUploadTrayStore.getState().markError(id, toErrorMessage(err)));
  };
}

export function useStartCourseThumbnailUpload(courseId: number) {
  const queryClient = useQueryClient();

  return (file: File, label: string, onDone?: (updated: CourseEditDetail) => void) => {
    const id = newTaskId();
    useUploadTrayStore.getState().addTask({ id, label, targetType: 'course-thumbnail', targetId: courseId });

    coursesApi
      .uploadThumbnail(courseId, file, (percent) => useUploadTrayStore.getState().updateProgress(id, percent))
      .then((updated) => {
        useUploadTrayStore.getState().markSuccess(id);
        queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] });
        onDone?.(updated);
      })
      .catch((err) => useUploadTrayStore.getState().markError(id, toErrorMessage(err)));
  };
}

/** F11.9 mở rộng — ảnh riêng cho buổi live, cùng khuôn với ảnh bìa khóa học ở trên. */
export function useStartLiveThumbnailUpload(sessionId: number) {
  const queryClient = useQueryClient();

  return (file: File, label: string, onDone?: (updated: LiveSession) => void) => {
    const id = newTaskId();
    useUploadTrayStore.getState().addTask({ id, label, targetType: 'live-thumbnail', targetId: sessionId });

    liveApi
      .uploadThumbnail(sessionId, file, (percent) => useUploadTrayStore.getState().updateProgress(id, percent))
      .then((updated) => {
        useUploadTrayStore.getState().markSuccess(id);
        queryClient.invalidateQueries({ queryKey: ['live-sessions', sessionId] });
        onDone?.(updated);
      })
      .catch((err) => useUploadTrayStore.getState().markError(id, toErrorMessage(err)));
  };
}
