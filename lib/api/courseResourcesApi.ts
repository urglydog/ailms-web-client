import { api } from '@/lib/api/client';
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

  uploadResource: async (courseId: number, formData: FormData): Promise<{successes: CourseResource[], failures: {file: string, reason: string}[]}> => {
    return api.post<{successes: CourseResource[], failures: {file: string, reason: string}[]}>(`/api/v1/instructor/resources/courses/${courseId}/upload`, formData, { 
      token: authToken(),
      headers: {} // Let browser set Content-Type with boundary for multipart/form-data
    });
  },

  deleteResource: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/instructor/resources/${id}`, { token: authToken() });
  }
};
