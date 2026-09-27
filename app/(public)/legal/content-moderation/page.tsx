import Link from 'next/link';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function ContentModerationPolicyPage() {
  return (
    <LegalPageLayout title="Quy định kiểm duyệt nội dung khóa học" updatedAt="26/09/2026">
      <LegalSection title="1. Vòng đời một khóa học">
        <p>
          Mỗi khóa học đi qua các trạng thái: <strong>Nháp</strong> (đang soạn) →{' '}
          <strong>Chờ duyệt</strong> (Giảng viên gửi yêu cầu xét duyệt) →{' '}
          <strong>Đã xuất bản</strong> (được chấp thuận, hiển thị công khai) hoặc{' '}
          <strong>Bị từ chối</strong> (cần chỉnh sửa lại) → <strong>Lưu trữ</strong> (ngừng nhận
          học viên mới).
        </p>
        <p>Chỉ khóa học ở trạng thái Đã xuất bản mới cho phép học viên đăng ký/mua.</p>
      </LegalSection>

      <LegalSection title="2. Quy trình xét duyệt">
        <p>
          Quản trị viên xem xét khóa học ở trạng thái Chờ duyệt và quyết định chấp thuận hoặc từ
          chối. Nếu từ chối, Quản trị viên bắt buộc phải nêu rõ lý do (tối thiểu 20 ký tự) để Giảng
          viên biết cần chỉnh sửa gì trước khi gửi duyệt lại.
        </p>
      </LegalSection>

      <LegalSection title="3. Kiểm duyệt đánh giá khóa học">
        <p>
          Các đánh giá (review) của học viên vi phạm quy định (spam, ngôn từ không phù hợp...)
          cũng có thể bị Quản trị viên ẩn/gỡ theo cơ chế kiểm duyệt riêng, độc lập với quy trình xét
          duyệt khóa học ở trên.
        </p>
      </LegalSection>

      <LegalSection title="4. Trách nhiệm nội dung">
        <p>
          Việc được xét duyệt không đồng nghĩa LinguaLearn xác minh đầy đủ tính chính xác hoặc bản
          quyền của nội dung — trách nhiệm cuối cùng vẫn thuộc về Giảng viên đăng tải, theo{' '}
          <Link href="/legal/terms">Điều khoản dịch vụ</Link>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
