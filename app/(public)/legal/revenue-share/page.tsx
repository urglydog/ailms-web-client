import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RevenueSharePolicyPage() {
  return (
    <LegalPageLayout
      title="Chính sách chia sẻ doanh thu Giảng viên"
      updatedAt="11/11/2026"
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

      <LegalSection title="3. Ghi nhận tỷ lệ">
        <p>
          Tỷ lệ chia sẻ được khóa lại ngay tại thời điểm đơn hàng chuyển trạng thái đã thanh toán và không áp dụng hồi tố cho các
          giao dịch trước đó. Hai tỷ lệ trên là mức hiện hành; quản trị viên có thể điều chỉnh và mức mới chỉ áp dụng cho giao dịch
          phát sinh sau thời điểm điều chỉnh. Các giao dịch phát sinh trước 20/09/2026 giữ nguyên tỷ lệ cũ (30% nền tảng / 70%
          Giảng viên) tại thời điểm phát sinh.
        </p>
      </LegalSection>

      <LegalSection title="4. Thời gian giữ tiền">
        <p>
          Thu nhập từ mỗi đơn hàng được giữ lại trong thời hạn hoàn tiền cộng thêm 3 ngày xử lý trước khi được tính vào số dư có
          thể rút, nhằm bảo đảm đủ thời gian để học viên gửi yêu cầu hoàn tiền và để xử lý các yêu cầu đó.
        </p>
      </LegalSection>

      <LegalSection title="5. Khi đơn hàng được hoàn tiền">
        <p>Học viên luôn được hoàn đủ số tiền đã thanh toán. Phần Giảng viên phải hoàn lại tùy theo nguyên nhân:</p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong>Mặc định:</strong> Giảng viên hoàn lại đúng phần thu nhập đã nhận từ đơn hàng đó (ví dụ khóa 1.000.000đ bán theo
            tỷ lệ organic 37%: Giảng viên hoàn lại 370.000đ). Áp dụng cho đổi ý trong thời hạn, lỗi hệ thống, thanh toán trùng,
            không được ghi danh.
          </li>
          <li>
            <strong>Lỗi do nền tảng:</strong> khi học viên đã dùng được khóa học nhưng sự cố thuộc về nền tảng, Giảng viên không bị
            trừ thu nhập.
          </li>
          <li>
            <strong>Lỗi do Giảng viên:</strong> mô tả sai nghiêm trọng hoặc vi phạm chính sách nền tảng; Giảng viên hoàn lại toàn bộ
            số tiền hoàn cho học viên, kèm lý do được ghi nhận.
          </li>
        </ul>
        <p>
          Phần bị trừ được ghi vào thu nhập của Giảng viên. Nếu thu nhập đã được chi trả trước đó, số dư của Giảng viên có thể âm
          và được bù trừ vào các khoản thu nhập sau. Giảng viên được thông báo, có 48 giờ để phản hồi kèm minh chứng trước khi
          quản trị viên quyết định.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
