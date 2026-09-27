import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '@/lib/api/certificates';

export function useMyCertificates() {
  return useQuery({
    queryKey: ['certificates', 'mine'],
    queryFn: certificatesApi.listMine,
  });
}

export function useCertificateDetail(certificateCode: string) {
  return useQuery({
    queryKey: ['certificates', certificateCode],
    queryFn: () => certificatesApi.getDetail(certificateCode),
    enabled: !!certificateCode,
  });
}

/** BR-CERT-06 — trang xác thực công khai, không cần đăng nhập. */
export function useCertificateVerification(certificateCode: string) {
  return useQuery({
    queryKey: ['certificates', 'verify', certificateCode],
    queryFn: () => certificatesApi.verify(certificateCode),
    enabled: !!certificateCode,
  });
}
