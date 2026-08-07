import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chaptersApi } from '@/lib/api/chapters';
import { coursesApi } from '@/lib/api/courses';
import { lessonsApi } from '@/lib/api/lessons';
import { getAccessToken } from '@/lib/auth/token';
import type {
  CourseStatus,
  CreateChapterInput,
  CreateCourseInput,
  CreateLessonInput,
  RejectCourseInput,
  ReorderInput,
  UpdateChapterInput,
  UpdateCourseInput,
  UpdateLessonInput,
} from '@/types/domain';

export function useMyCourses(params: { status?: CourseStatus; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['courses', 'mine', params],
    queryFn: () => coursesApi.listMine(params),
    enabled: !!getAccessToken(),
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
