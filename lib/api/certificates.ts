import { api, apiBlob } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { Certificate, CertificateVerification } from '@/types/domain';

/** "Chứng chỉ của tôi" + xác thực công khai (doc/DacTa_ChucNangChungChi.md). */
export const certificatesApi = {
  listMine: () => api.get<Certificate[]>('/api/v1/certificates/me', { token: getAccessToken() ?? undefined }),

  getDetail: (certificateCode: string) =>
    api.get<Certificate>(`/api/v1/certificates/${certificateCode}`, { token: getAccessToken() ?? undefined }),

  /** BR-CERT-09 — render on-demand + cache B2, tự refresh access token nếu hết hạn (qua `apiBlob`). */
  downloadPdf: (certificateCode: string) => apiBlob(`/api/v1/certificates/${certificateCode}/pdf`),

  /** BR-CERT-06 — công khai, KHÔNG cần đăng nhập, không gửi token. */
  verify: (certificateCode: string) =>
    api.get<CertificateVerification>(`/api/v1/certificates/verify/${certificateCode}`),
};
