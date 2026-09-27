import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Chính sách hoàn tiền" updatedAt="26/09/2026">
      <LegalSection title="1. Mọi giao dịch là cuối cùng">
        <p>
          LinguaLearn hiện <strong>không hỗ trợ hoàn tiền hoặc hủy một phần</strong> đơn hàng sau
          khi thanh toán thành công. Ngay khi giao dịch hoàn tất, học viên được cấp quyền truy cập
          trọn đời vào khóa học đã mua.
        </p>
      </LegalSection>

      <LegalSection title="2. Vì sao chính sách này áp dụng">
        <p>
          Khóa học là sản phẩm số hóa được cấp quyền truy cập ngay lập tức, không giống hàng hóa
          vật lý có thể hoàn trả. Vì vậy, chúng tôi khuyến khích học viên xem kỹ mô tả, trình độ,
          nội dung khóa học trước khi quyết định thanh toán.
        </p>
      </LegalSection>

      <LegalSection title="3. Trường hợp lỗi kỹ thuật">
        <p>
          Nếu bạn bị trừ tiền nhưng hệ thống không ghi nhận đơn hàng/khóa học tương ứng do lỗi kỹ
          thuật, vui lòng liên hệ đội ngũ hỗ trợ (thông tin liên hệ ở cuối trang) kèm mã giao dịch
          để được xử lý riêng.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
