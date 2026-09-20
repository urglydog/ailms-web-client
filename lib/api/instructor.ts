import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

export interface InstructorVerification {
  id: number;
  idNumber: string;
  addressText: string;
  contentOwnershipConfirmed: boolean;
  verifiedAt: string;
}

export interface InstructorVerificationStatus {
  verified: boolean;
}

export interface SubmitVerificationReq {
  idNumber: string;
  addressText: string;
  contentOwnershipConfirmed: boolean;
}

/**
 * "Trở thành Giảng viên" + xác minh định danh (15/09/2026, thiết kế lại — bỏ UC41 duyệt thủ
 * công của Admin). Bấm "Trở thành Giảng viên" nâng role NGAY, không chờ ai duyệt; xác minh
 * định danh (BR-VERIFY-01) chỉ bắt buộc trước khi gửi khóa học ĐẦU TIÊN đi duyệt, xem
 * `app/(public)/profile/page.tsx` và `components/instructor/CourseBuilderForm.tsx`.
 */
export const instructorApi = {
  /** Nâng role STUDENT → INSTRUCTOR ngay lập tức. Gọi `authApi.refresh()` NGAY SAU khi thành công. */
  become: () => api.post<void>('/api/v1/instructor/become', undefined, { token: getAccessToken() ?? undefined }),

  getVerificationStatus: () =>
    api.get<InstructorVerificationStatus>('/api/v1/instructor/verification/status', {
      token: getAccessToken() ?? undefined,
    }),

  getMyVerification: () =>
    api.get<InstructorVerification>('/api/v1/instructor/verification/me', {
      token: getAccessToken() ?? undefined,
    }),

  submitVerification: (req: SubmitVerificationReq) =>
    api.post<InstructorVerification>('/api/v1/instructor/verification', req, {
      token: getAccessToken() ?? undefined,
    }),
};
