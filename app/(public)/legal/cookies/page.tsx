import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout title="Chính sách Cookie" updatedAt="26/09/2026">
      <LegalSection title="1. LinguaLearn không dùng cookie theo dõi">
        <p>
          Hệ thống hiện <strong>không sử dụng cookie</strong> cho mục đích theo dõi hành vi, quảng
          cáo hay phân tích bên thứ ba.
        </p>
      </LegalSection>

      <LegalSection title="2. Lưu trữ trình duyệt (localStorage)">
        <p>
          Để duy trì phiên đăng nhập, LinguaLearn lưu mã truy cập (access token) và mã làm mới
          (refresh token) dạng JWT trong bộ nhớ cục bộ (localStorage) của trình duyệt trên thiết bị
          của bạn. Dữ liệu này chỉ tồn tại trên trình duyệt bạn đang dùng, không được gửi cho bên
          thứ ba.
        </p>
        <p>
          Bạn có thể xóa dữ liệu này bất cứ lúc nào bằng cách xóa dữ liệu trình duyệt hoặc đăng
          xuất — thao tác này sẽ kết thúc phiên đăng nhập hiện tại.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
