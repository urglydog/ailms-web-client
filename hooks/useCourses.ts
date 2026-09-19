import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chaptersApi } from '@/lib/api/chapters';
import { coursesApi } from '@/lib/api/courses';
import { lessonsApi } from '@/lib/api/lessons';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CourseStatus,
  CourseVisibility,
  CreateChapterInput,
  CreateCourseInput,
  CreateLessonInput,
  RejectCourseInput,
  ReorderInput,
  SetYoutubeVideoInput,
  UpdateChapterInput,
  UpdateCourseInput,
  UpdateLessonInput,
} from '@/types/domain';

export function useMyCourses(
  params: { status?: CourseStatus; page?: number; size?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['courses', 'mine', params],
    queryFn: () => coursesApi.listMine(params),
    // `/api/v1/courses/mine` chỉ dành cho INSTRUCTOR (403 với ADMIN) — `enabled` cho phép nơi
    // gọi (VD: `CoursePicker` dùng chung cho cả Admin lẫn Instructor ở trang coupon) tắt hẳn
    // request này khi đang ở vai trò không phù hợp, thay vì để nó tự bắn 403 vô ích.
    enabled: (options.enabled ?? true) && !!getAccessToken(),
  });
}

export function useMyCourseDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['courses', 'mine', id],
    queryFn: () => coursesApi.getMineDetail(id as number),
    enabled: !!id && !!getAccessToken(),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) => coursesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] }),
  });
}

export function useUpdateCourse(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCourseInput) => coursesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
    },
  });
}

export function useSubmitCourse(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => coursesApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] }),
  });
}

/** "Kích hoạt lại" (19/09/2026, tính năng mới) — khôi phục khóa đang ở trạng thái lưu trữ. */
export function useReactivateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursesApi.reactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] });
    },
  });
}

// ==================== "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026) ====================

export function useUpdateCourseVisibility(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { visibility: CourseVisibility; password?: string | null }) =>
      coursesApi.updateVisibility(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id] }),
  });
}

export function useCourseInvites(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['courses', 'mine', id, 'invites'],
    queryFn: () => coursesApi.listInvites(id),
    enabled: enabled && !!getAccessToken(),
  });
}

export function useAddCourseInvite(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => coursesApi.addInvite(id, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id, 'invites'] }),
  });
}

export function useRemoveCourseInvite(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => coursesApi.removeInvite(id, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', id, 'invites'] }),
  });
}

export function useModerationQueue(params: { status?: CourseStatus; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['courses', 'moderation', params],
    queryFn: () => coursesApi.listModeration(params),
    enabled: !!getAccessToken(),
  });
}

export function useModerationDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['courses', 'moderation', id],
    queryFn: () => coursesApi.getModerationDetail(id as number),
    enabled: !!id && !!getAccessToken(),
  });
}

export function useApproveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursesApi.approve(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'moderation', id] });
    },
  });
}

export function useRejectCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: RejectCourseInput }) => coursesApi.reject(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'moderation', id] });
    },
  });
}

// ── Chapter / Lesson — cùng invalidate chi tiết khóa học đang sửa ──

export function useCreateChapter(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChapterInput) => chaptersApi.create(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useUpdateChapter(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateChapterInput }) => chaptersApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useDeleteChapter(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => chaptersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useReorderChapters(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderInput) => chaptersApi.reorder(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useCreateLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, input }: { chapterId: number; input: CreateLessonInput }) =>
      lessonsApi.create(chapterId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useUpdateLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateLessonInput }) => lessonsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useDeleteLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => lessonsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useReorderLessons(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, input }: { chapterId: number; input: ReorderInput }) =>
      lessonsApi.reorder(chapterId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

// ── Giai đoạn 4 — nạp video (UC34), tài liệu đính kèm (UC35) ──
// Upload có tiến độ (video/tài liệu/ảnh bìa) dùng `hooks/useUploadTray.ts` (khay tải lên toàn
// cục kiểu Google Drive), KHÔNG dùng useMutation ở đây — xem comment trong file đó vì sao.

export function useSetYoutubeVideo(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, input }: { lessonId: number; input: SetYoutubeVideoInput }) =>
      lessonsApi.setYoutubeVideo(lessonId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useDeleteLessonVideo(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: number) => lessonsApi.deleteVideo(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine', courseId] }),
  });
}

export function useLessonDocuments(lessonId: number | null) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'documents'],
    queryFn: () => lessonsApi.listDocuments(lessonId as number),
    enabled: lessonId !== null && !!getAccessToken(),
  });
}

/** BR-COURSE-06 — Admin xem tài liệu để kiểm duyệt (khóa đang PENDING), không cần sở hữu. */
export function useModerationLessonDocuments(lessonId: number | null) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'documents', 'moderation'],
    queryFn: () => lessonsApi.listDocumentsForModeration(lessonId as number),
    enabled: lessonId !== null && !!getAccessToken(),
  });
}

export function useAddLessonDocumentLink(lessonId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; url: string }) => lessonsApi.addDocumentLink(lessonId as number, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'documents'] }),
  });
}

export function useDeleteLessonDocument(lessonId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => lessonsApi.deleteDocument(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'documents'] }),
  });
}
