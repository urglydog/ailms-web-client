import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RevenueSharePolicyPage() {
  return (
    <LegalPageLayout
      title="Chính sách chia sẻ doanh thu Giảng viên"
      updatedAt="26/09/2026"
      intro={<p>Áp dụng từ 20/09/2026 cho các giao dịch mới. Tỷ lệ được xác định tại thời điểm thanh toán thành công.</p>}
    >
      <LegalSection title="1. Học viên tìm khóa học qua nền tảng (Organic)">
        <p>
          Khi học viên tìm và mua khóa học trực tiếp qua tính năng tìm kiếm/duyệt danh mục của
          LinguaLearn: Giảng viên nhận <strong>37%</strong> doanh thu, nền tảng giữ lại{' '}
          <strong>63%</strong> để vận hành hệ thống.
        </p>
      </LegalSection>

      <LegalSection title="2. Học viên mua qua liên kết chia sẻ riêng (Referral)">
        <p>
          Mỗi khóa học có một liên kết chia sẻ riêng (referral link) mà Giảng viên có thể quảng bá
          trên kênh của mình (Facebook, YouTube, blog cá nhân...). Khi học viên mua khóa học thông
          qua liên kết này: Giảng viên nhận <strong>97%</strong> doanh thu, nền tảng chỉ giữ lại{' '}
          <strong>3%</strong> phí duy trì hạ tầng.
        </p>
      </LegalSection>

      <LegalSection title="3. Ghi nhận & thanh toán">
        <p>
          Tỷ lệ chia sẻ được khóa lại ngay tại thời điểm đơn hàng chuyển trạng thái đã thanh toán
          và không áp dụng hồi tố cho các giao dịch trước đó. Các giao dịch phát sinh trước
          20/09/2026 giữ nguyên tỷ lệ chia sẻ cũ (30% nền tảng / 70% Giảng viên) tại thời điểm phát
          sinh.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
