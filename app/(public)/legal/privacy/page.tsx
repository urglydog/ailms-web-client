import Link from 'next/link';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Chính sách quyền riêng tư"
      updatedAt="26/09/2026"
      intro={<p>Chính sách này mô tả những dữ liệu cá nhân LinguaLearn thu thập và cách sử dụng.</p>}
    >
      <LegalSection title="1. Thông tin thu thập">
        <p>
          Khi đăng ký tài khoản: email, họ tên, mật khẩu (hoặc thông tin cơ bản từ Google nếu đăng
          nhập bằng Google — chỉ gồm email/tên/ảnh đại diện theo phạm vi OAuth chuẩn, không truy
          cập dữ liệu Google khác).
        </p>
        <p>
          Trong quá trình sử dụng: ảnh đại diện, tiêu đề giới thiệu (headline), tiểu sử (bio), ngôn
          ngữ ưu tiên hiển thị, tiến độ học tập, lịch sử giao dịch.
        </p>
        <p>
          Riêng tài khoản Giảng viên: số CCCD/CMND và địa chỉ liên hệ — chỉ để lưu hồ sơ nội bộ, xem
          thêm tại <Link href="/legal/terms">Điều khoản dịch vụ</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. Cài đặt hiển thị hồ sơ công khai">
        <p>
          Tại trang <Link href="/profile">Hồ sơ cá nhân</Link>, bạn có thể bật/tắt hiển thị công
          khai riêng cho &quot;Khóa học đã học&quot; và &quot;Danh sách yêu thích&quot; trên trang hồ
          sơ công khai của mình. Cả hai mặc định ở trạng thái bật khi tạo tài khoản.
        </p>
      </LegalSection>

      <LegalSection title="3. Lưu trữ phiên đăng nhập">
        <p>
          Hệ thống <strong>không sử dụng cookie theo dõi</strong>. Phiên đăng nhập được duy trì
          bằng mã truy cập (JWT) lưu trong bộ nhớ cục bộ (localStorage) của trình duyệt — chi tiết
          tại <Link href="/legal/cookies">Chính sách Cookie</Link>.
        </p>
      </LegalSection>

      <LegalSection title="4. Chia sẻ dữ liệu với bên thứ ba">
        <p>
          LinguaLearn không bán hoặc chia sẻ dữ liệu cá nhân cho bên thứ ba ngoài mục đích xử lý
          thanh toán (cổng thanh toán VNPay/PayOS) và xác thực đăng nhập (Google OAuth, nếu bạn
          chọn sử dụng).
        </p>
      </LegalSection>

      <LegalSection title="5. Yêu cầu xóa dữ liệu">
        <p>
          Hiện tại việc xóa tài khoản chỉ được Quản trị viên thực hiện. Nếu bạn muốn yêu cầu xóa
          tài khoản và dữ liệu liên quan, vui lòng liên hệ qua email hỗ trợ ở cuối trang.
        </p>
      </LegalSection>

      <LegalSection title="6. Thay đổi chính sách">
        <p>Chính sách này có thể được cập nhật khi hệ thống bổ sung tính năng mới liên quan đến dữ liệu người dùng.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
