import { api, uploadFiles } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export interface CourseResource {
  id: number;
  title: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  chapterId: number | '';
  lessonId: number | '';
  createdAt: string;
}

export const courseResourcesApi = {
  getCourseResources: async (courseId: number): Promise<CourseResource[]> => {
    return api.get<CourseResource[]>(`/api/v1/instructor/resources/courses/${courseId}`, { token: authToken() });
  },

  // `api.post` không dùng được cho upload file thật — nó luôn JSON.stringify body, làm rỗng
  // mọi FormData (đã xác nhận là nguyên nhân "tải lên không được"). Dùng uploadFiles (XHR)
  // thay thế, cùng khuôn với uploadFile đã dùng ổn định ở nơi khác trong app.
  uploadResource: async (
    courseId: number,
    files: File[],
    options?: { chapterId?: number; lessonId?: number; onProgress?: (percent: number) => void },
  ): Promise<{ successes: CourseResource[]; failures: { file: string; reason: string }[] }> => {
    const extraFields: Record<string, string | number> = {};
    if (options?.chapterId !== undefined) extraFields.chapterId = options.chapterId;
    if (options?.lessonId !== undefined) extraFields.lessonId = options.lessonId;

    return uploadFiles<{ successes: CourseResource[]; failures: { file: string; reason: string }[] }>(
      `/api/v1/instructor/resources/courses/${courseId}/upload`,
      files,
      { token: authToken(), onProgress: options?.onProgress, extraFields },
    );
  },

  deleteResource: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/instructor/resources/${id}`, { token: authToken() });
  }
};
