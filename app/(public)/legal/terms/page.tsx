import Link from 'next/link';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Điều khoản dịch vụ"
      updatedAt="26/09/2026"
      intro={
        <p>
          LinguaLearn là nền tảng học trực tuyến (LMS) tích hợp AI, phát triển trong khuôn khổ đề
          tài khóa luận tốt nghiệp tại Trường Đại học Công nghiệp TP. Hồ Chí Minh. Khi tạo tài
          khoản và sử dụng hệ thống, bạn đồng ý với các điều khoản dưới đây.
        </p>
      }
    >
      <LegalSection title="1. Tài khoản người dùng">
        <p>
          Hệ thống có 3 vai trò: Học viên, Giảng viên và Quản trị viên. Mọi tài khoản Học viên đều
          có thể tự nâng cấp thành Giảng viên bất kỳ lúc nào tại trang{' '}
          <Link href="/teaching">Giảng dạy trên LinguaLearn</Link> mà không mất quyền sở hữu các
          khóa học đã mua với tư cách Học viên trước đó.
        </p>
        <p>
          Khi đăng ký làm Giảng viên, bạn cần cung cấp thông tin định danh (số CCCD/CMND, địa chỉ)
          và xác nhận quyền sở hữu hợp pháp đối với nội dung mình đăng tải. Hệ thống hiện{' '}
          <strong>chỉ thu thập</strong> các thông tin này để lưu hồ sơ nội bộ —{' '}
          <strong>không</strong> gọi bất kỳ API eKYC/định danh điện tử nào của cơ quan nhà nước để
          xác thực.
        </p>
      </LegalSection>

      <LegalSection title="2. Nội dung khóa học & bản quyền">
        <p>
          Giảng viên chịu hoàn toàn trách nhiệm về tính hợp pháp, bản quyền và độ chính xác của nội
          dung mình đăng tải (video bài giảng, tài liệu đính kèm, câu hỏi trắc nghiệm...).
          LinguaLearn không xác minh bản quyền nội dung thay cho Giảng viên trước khi xuất bản.
        </p>
        <p>
          Mọi khóa học phải được Quản trị viên xét duyệt trước khi hiển thị công khai — xem chi
          tiết tại <Link href="/legal/content-moderation">Quy định kiểm duyệt nội dung</Link>.
        </p>
      </LegalSection>

      <LegalSection title="3. Thanh toán & học phí">
        <p>
          Học phí được thanh toán một lần qua VNPay hoặc PayOS. Sau khi thanh toán thành công, học
          viên được cấp quyền truy cập khóa học ngay lập tức và không giới hạn thời gian. Xem chi
          tiết chính sách hoàn tiền tại <Link href="/legal/refund">Chính sách hoàn tiền</Link>.
        </p>
        <p>
          Doanh thu được chia sẻ giữa Giảng viên và nền tảng theo tỷ lệ tùy nguồn gốc đơn hàng — xem{' '}
          <Link href="/legal/revenue-share">Chính sách chia sẻ doanh thu</Link>.
        </p>
      </LegalSection>

      <LegalSection title="4. Hành vi bị cấm">
        <p>
          Nghiêm cấm đăng tải nội dung vi phạm pháp luật Việt Nam, xâm phạm bản quyền, mang tính
          xúc phạm, lừa đảo, hoặc cố tình khai thác lỗi hệ thống. Tài khoản vi phạm có thể bị khóa
          hoặc gỡ nội dung mà không cần báo trước.
        </p>
      </LegalSection>

      <LegalSection title="5. Giới hạn trách nhiệm">
        <p>
          Đây là sản phẩm nghiên cứu học thuật, được vận hành nhằm mục đích minh họa các tính năng
          AI trong giáo dục trực tuyến. LinguaLearn không cam kết tính sẵn sàng liên tục 100% của
          dịch vụ và không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng
          nền tảng.
        </p>
      </LegalSection>

      <LegalSection title="6. Thay đổi điều khoản">
        <p>
          Điều khoản này có thể được cập nhật theo thời gian để phản ánh đúng các tính năng đang
          triển khai. Phiên bản mới nhất luôn được đăng tại trang này.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
