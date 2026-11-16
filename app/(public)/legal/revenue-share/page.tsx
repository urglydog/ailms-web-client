import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RevenueSharePolicyPage() {
  return (
    <LegalPageLayout
      title="Chính sách chia sẻ doanh thu Giảng viên"
      updatedAt="17/11/2026"
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
            <strong>Lỗi do Giảng viên:</strong> chỉ áp dụng khi có vi phạm có tên và có bằng chứng (xem mục 6); Giảng viên hoàn lại{' '}
            <strong>100% giá trị đơn hàng</strong> (không cộng thêm khoản phí hay công thức nào khác), kèm lý do và minh chứng được ghi nhận.
          </li>
        </ul>
        <p>
          Phần bị trừ được ghi vào thu nhập của Giảng viên. Nếu thu nhập đã được chi trả trước đó, số dư của Giảng viên có thể âm
          và được bù trừ vào các khoản thu nhập sau. Giảng viên được thông báo, có 48 giờ để phản hồi kèm minh chứng trước khi
          quản trị viên quyết định.
        </p>
      </LegalSection>

      <LegalSection title="6. Tiêu chuẩn để quy trách nhiệm cho Giảng viên">
        <p>Quản trị viên chọn một <strong>mã lý do cố định</strong>, mỗi mã chỉ đi với một chế độ trách nhiệm:</p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li><strong>Chế độ mặc định:</strong> học viên đổi ý trong hạn hoặc lý do khác không ai có lỗi.</li>
          <li><strong>Nền tảng gánh:</strong> lỗi kỹ thuật, thanh toán trùng, không ghi danh, lỗi từ phía nền tảng.</li>
          <li>
            <strong>Giảng viên chịu toàn bộ:</strong> chỉ khi vi phạm bản quyền, nội dung sai khác nghiêm trọng so với mô tả, hoặc nội dung bị cấm.
            Bắt buộc có ghi chú lý do, minh chứng rõ ràng, và Giảng viên đã được thông báo và có cơ hội phản hồi (đã phản hồi hoặc đã hết hạn
            phản hồi) trước khi quyết định.
          </li>
        </ul>
        <p>
          Giảng viên luôn được thông báo số tiền bị trừ cùng lý do, ghi chú và minh chứng. Với quyết định &quot;Giảng viên chịu toàn bộ&quot;, Giảng
          viên được <strong>khiếu nại một lần trong 7 ngày</strong> kể từ lúc duyệt hoàn tiền; quản trị viên giữ nguyên quyết định hoặc giảm về chế độ
          mặc định (khi đó phần phạt vượt mức được hoàn lại vào số dư). Hệ thống chỉ gửi cảnh báo khi một khóa có tỷ lệ hoàn tiền cao để quản trị
          viên xem xét; hệ thống không tự động trừ tiền hay gỡ khóa.
        </p>
      </LegalSection>

      <LegalSection title="7. Công nợ">
        <p>
          Khi phần bị trừ vượt số dư khả dụng, số dư của Giảng viên âm và khoản âm đó là <strong>công nợ</strong>. Doanh thu mới được tự động
          bù trừ vào công nợ khi hết thời gian giữ, và trong thời gian nợ Giảng viên vẫn bán khóa học bình thường. Giảng viên cũng có thể{' '}
          <strong>trả nợ chủ động</strong> qua mã QR PayOS, trả một phần hoặc trả hết; hệ thống ghi nhận đúng số tiền đã trả.
        </p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li><strong>Ngay khi phát sinh:</strong> Giảng viên được thông báo, trang Thu nhập hiển thị công nợ kèm lý do.</li>
          <li><strong>Quá 30 ngày chưa trả hết:</strong> tạm thời không xuất bản khóa học mới và không đăng ký quảng bá.</li>
          <li>
            <strong>Quá 90 ngày:</strong> các khóa học tạm ngừng nhận đăng ký mới; học viên đã mua vẫn học bình thường và quyền lợi của họ không bị ảnh hưởng.
          </li>
          <li>Trong lúc có khiếu nại đang chờ xử lý, các hạn chế trên được tạm dừng. Hết nợ thì mọi hạn chế được gỡ.</li>
          <li>Nợ không dẫn tới khóa tài khoản hay gắn cờ vi phạm. Quản trị viên có thể xóa nợ kèm lý do được ghi nhận.</li>
        </ul>
        <p>Các mốc 30 ngày và 90 ngày là mức hiện hành, có thể điều chỉnh và được cập nhật tại trang này.</p>
      </LegalSection>

      <LegalSection title="8. Rút tiền và tài khoản nhận tiền">
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>Giảng viên đã xác minh có thể liên kết tối đa 5 tài khoản ngân hàng và chọn một tài khoản mặc định để nhận tiền.</li>
          <li>Thêm tài khoản, hoặc đổi ngân hàng/số tài khoản, cần xác nhận qua email. Đổi riêng tên chủ tài khoản hoặc đổi tài khoản mặc định được áp dụng ngay.</li>
          <li>Số tiền rút tối thiểu 100.000đ; yêu cầu rút cần xác nhận qua email và được chi theo đợt (mặc định ngày 5 và ngày 20 hằng tháng).</li>
          <li>
            Mỗi yêu cầu rút lưu lại tài khoản tại thời điểm tạo, nên đổi tài khoản mặc định sau đó không ảnh hưởng yêu cầu đang chờ. Yêu cầu chưa được
            duyệt có thể đổi sang tài khoản khác (ví dụ khi ngân hàng bảo trì).
          </li>
          <li>
            Khoản chuyển được thực hiện đúng theo thông tin tài khoản đã xác nhận; Giảng viên chịu trách nhiệm về độ chính xác của thông tin đó. Nếu
            ngân hàng từ chối, số tiền được trả lại số dư để Giảng viên chọn tài khoản khác và gửi lại yêu cầu.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Phí chuyển tiền">
        <p>
          Phí chuyển tiền phát sinh khi chi trả cho Giảng viên (rút tiền) hoặc hoàn tiền cho học viên do <strong>nền tảng chịu</strong> và
          đã nằm trong phần nền tảng giữ lại ở mục 1 và mục 2. Phí này không bị trừ thêm vào thu nhập của Giảng viên: số tiền bạn yêu cầu rút
          là số tiền bạn nhận được.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
