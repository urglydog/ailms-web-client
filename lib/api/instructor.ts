import { ApiError, api, resolveBaseUrl } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { ProblemDetail } from '@/types/domain';

export interface InstructorVerification {
  id: number;
  idNumber: string;
  idPhotoUrl: string;
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
  file: File;
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

  /**
   * Multipart có kèm field text (`idNumber`/`addressText`/`contentOwnershipConfirmed`) NGOÀI
   * file ảnh CCCD — khác khuôn `uploadFile()` dùng chung ở `lib/api/client.ts` (chỉ gửi đúng 1
   * field `"file"`), nên tự dựng `FormData` + `fetch` ở đây thay vì tái dùng hàm đó.
   */
  submitVerification: async (req: SubmitVerificationReq): Promise<InstructorVerification> => {
    const formData = new FormData();
    formData.append('idNumber', req.idNumber);
    formData.append('addressText', req.addressText);
    formData.append('contentOwnershipConfirmed', String(req.contentOwnershipConfirmed));
    formData.append('file', req.file);

    const token = getAccessToken();
    const res = await fetch(`${resolveBaseUrl()}/api/v1/instructor/verification`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      let problem: ProblemDetail;
      try {
        problem = (await res.json()) as ProblemDetail;
      } catch {
        problem = {
          type: 'about:blank',
          title: res.statusText,
          status: res.status,
          detail: `Yêu cầu thất bại với mã ${res.status}`,
          instance: res.url,
          code: 'NON_JSON_RESPONSE',
          timestamp: new Date().toISOString(),
        };
      }
      throw new ApiError(problem);
    }
    return (await res.json()) as InstructorVerification;
  },
};
