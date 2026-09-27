'use client';

import { useParams } from 'next/navigation';
import { XCircle, ShieldAlert } from 'lucide-react';
import { useCertificateVerification } from '@/hooks/useCertificates';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';

/** Trang xác thực công khai chứng chỉ (doc/DacTa_ChucNangChungChi.md, mục 8) — KHÔNG cần đăng
 * nhập, ai có link (kể cả nhà tuyển dụng không có tài khoản) cũng xem được (BR-CERT-06). KHÔNG có
 * email, KHÔNG có nút tải PDF.
 *
 * (26/09/2026, sửa lỗi) — trước đây chỉ hiện 1 câu xác nhận dạng chữ ("Chứng chỉ hợp lệ" + tên/
 * khóa học/ngày), không cho thấy HÌNH chứng chỉ thật — người xem (vd. nhà tuyển dụng) không thấy
 * được thiết kế/nội dung đầy đủ như trên bản PDF. Giờ hiện NGUYÊN hình (`CertificatePreview`)
 * khi hợp lệ; chỉ giữ lại thẻ trạng thái dạng chữ cho 2 trường hợp KHÔNG có gì để vẽ thành hình
 * (không tìm thấy / đã thu hồi — BR-CERT-07 yêu cầu hiển thị RÕ là không hợp lệ, không được trông
 * giống chứng chỉ thật). */
export default function VerifyCertificatePage() {
  const params = useParams<{ certificateCode: string }>();
  const { data, isLoading } = useCertificateVerification(params.certificateCode);

  const isValid = !!data?.found && data.status === 'ACTIVE'
    && data.certificateCode && data.studentName && data.courseTitle
    && data.courseHours != null && data.instructorName && data.completedAt && data.verifyUrl;

  // (26/09/2026, theo yêu cầu) — khi hợp lệ, KHÔNG lặp lại logo/nhãn "Chứng chỉ hợp lệ" ở ngoài
  // nữa vì bản thân hình chứng chỉ đã có sẵn logo LinguaLearn — chỉ hiện đúng 1 hình, cho to hết
  // cỡ khung trang. 2 trường hợp không có gì để vẽ thành hình (không tìm thấy/đã thu hồi) vẫn giữ
  // logo + khung trạng thái dạng chữ như cũ, để trang không bị trống thương hiệu.
  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-14 text-center">
        <p className="text-sm text-ink-muted">Đang kiểm tra chứng chỉ...</p>
      </div>
    );
  }

  if (isValid && data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
        <CertificatePreview
          certificate={{
            certificateCode: data.certificateCode!,
            studentName: data.studentName!,
            courseTitle: data.courseTitle!,
            courseHours: data.courseHours!,
            instructorName: data.instructorName!,
            completedAt: data.completedAt!,
            verifyUrl: data.verifyUrl!,
          }}
          interactive={false}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full flex-col items-center px-4 py-14 text-center sm:px-8">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-white">L</span>
        <span className="font-display text-[19px] font-bold text-ink">LinguaLearn</span>
      </div>

      {!data || !data.found ? (
        <StatusCard
          icon={<XCircle className="h-10 w-10 text-danger" strokeWidth={1.5} />}
          title="Không tìm thấy chứng chỉ"
          description="Mã chứng chỉ này không tồn tại trong hệ thống. Vui lòng kiểm tra lại đường dẫn."
        />
      ) : (
        <StatusCard
          icon={<ShieldAlert className="h-10 w-10 text-danger" strokeWidth={1.5} />}
          title="Chứng chỉ đã bị thu hồi"
          description="Chứng chỉ này đã bị quản trị viên thu hồi và không còn giá trị xác thực."
        />
      )}
    </div>
  );
}

function StatusCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border border-line bg-white p-8 shadow-card">
      {icon}
      <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}
