import Link from 'next/link';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Chính sách hoàn tiền"
      updatedAt="17/11/2026"
      intro={<p>Áp dụng cho các khiếu nại gửi từ 11/11/2026 (mục 4 và 6 bổ sung từ 14/11/2026). Các con số dưới đây là mức hiện hành, quản trị viên có thể điều chỉnh và được cập nhật tại trang này.</p>}
    >
      <LegalSection title="1. Khi nào được hoàn tiền">
        <p>
          Bạn được xem xét hoàn tiền <strong>100%</strong> số tiền đã thanh toán nếu đồng thời thỏa hai điều kiện: yêu cầu được
          gửi trong vòng <strong>7 ngày</strong> kể từ ngày thanh toán thành công, và bạn đã học <strong>không quá 20%</strong> nội
          dung khóa học. Nếu ngày cuối cùng của thời hạn rơi vào thứ Bảy, Chủ nhật hoặc ngày lễ, thời hạn được gia hạn đến hết
          ngày làm việc kế tiếp.
        </p>
        <p>
          Đây là điều kiện để yêu cầu được xem là <em>đủ điều kiện</em>; quyết định cuối cùng do quản trị viên đưa ra sau khi xem
          xét cả ý kiến của bạn lẫn phản hồi của giảng viên.
        </p>
      </LegalSection>

      <LegalSection title="2. Lỗi kỹ thuật được xét riêng">
        <p>
          Các trường hợp sau không bị giới hạn bởi thời hạn và tiến độ học: bị trừ tiền hai lần cho cùng một đơn, đã trừ tiền
          nhưng không được ghi danh vào khóa học, hoặc lỗi hệ thống khiến bạn không thể sử dụng khóa học đã mua. Hãy chọn đúng
          loại vấn đề khi gửi khiếu nại và đính kèm minh chứng (ảnh/video).
        </p>
      </LegalSection>

      <LegalSection title="3. Quy trình xử lý">
        <ol className="m-0 flex list-decimal flex-col gap-1 pl-5">
          <li>Vào <Link href="/disputes/new">Khiếu nại giao dịch</Link>, chọn giao dịch, loại vấn đề, mô tả và đính kèm minh chứng.</li>
          <li>Giảng viên của khóa học được thông báo và có <strong>48 giờ</strong> để phản hồi (đồng ý hoặc phản đối, kèm minh chứng).</li>
          <li>Quản trị viên xem xét cả hai bên và quyết định. Kết quả, kèm lý do, được gửi qua email và hiển thị trong trang khiếu nại.</li>
          <li>Nếu được hoàn tiền, chúng tôi chuyển khoản <strong>đủ 100%</strong> số tiền đã thanh toán vào tài khoản bạn đã cung cấp. LinguaLearn chi trả phí chuyển tiền nên khoản hoàn của bạn không bị khấu trừ. Chúng tôi sẽ báo lại khi đã chuyển.</li>
        </ol>
        <p>Mỗi giao dịch chỉ được gửi một khiếu nại. Nếu đã được báo chuyển tiền mà chưa nhận được, bạn có thể báo lại một lần trong vòng 7 ngày.</p>
      </LegalSection>

      <LegalSection title="4. Tài khoản nhận hoàn tiền và trách nhiệm của bạn">
        <p>
          Khi gửi khiếu nại, bạn chọn ngân hàng, nhập số tài khoản (nhập hai lần), tên chủ tài khoản và <strong>xác nhận đây là tài khoản của
          chính bạn</strong>. Khoản hoàn được chuyển <strong>đúng theo thông tin bạn khai</strong>, nên bạn chịu trách nhiệm về độ chính xác của
          nó.
        </p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>
            Nếu bạn nhập sai nhưng số đó vẫn là một tài khoản có thật, tiền sẽ đến tài khoản đó và việc thu hồi rất khó khăn; chúng tôi không
            chịu trách nhiệm về khoản chuyển đúng theo thông tin bạn đã xác nhận.
          </li>
          <li>
            Nếu số tài khoản không tồn tại hoặc ngân hàng từ chối, khoản chuyển không thực hiện được; chúng tôi sẽ liên hệ bạn qua thông báo/email
            để cập nhật lại thông tin trước khi chuyển.
          </li>
          <li>Không điền thông tin tài khoản khi gửi khiếu nại thì bạn cần liên hệ hỗ trợ để bổ sung trước khi nhận tiền.</li>
        </ul>
        <p>
          Trạng thái <em>&quot;Đã duyệt · chờ chuyển khoản&quot;</em> nghĩa là yêu cầu đã được chấp nhận nhưng tiền <strong>chưa</strong> chuyển;
          chỉ khi hiển thị <em>&quot;Đã hoàn tiền&quot;</em> thì tiền đã được chuyển đi và bạn nhận kèm mã chuyển khoản.
        </p>
      </LegalSection>

      <LegalSection title="5. Sau khi được hoàn tiền">
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
          <li>Quyền truy cập khóa học bị thu hồi; chứng chỉ của khóa học (nếu có) bị thu hồi và đánh giá của bạn về khóa học bị ẩn.</li>
          <li>Nếu bạn mua lại khóa học này sau đó, tiến độ học cũ được khôi phục.</li>
          <li>Mỗi khóa học chỉ được hoàn tiền một lần cho mỗi học viên. Việc hoàn tiền lặp lại nhiều lần có thể bị xem xét và hạn chế.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Trách nhiệm giữa nền tảng và giảng viên">
        <p>
          Bạn luôn nhận lại đủ số tiền đã thanh toán. Việc giảng viên và nền tảng mỗi bên chịu bao nhiêu được quy định tại{' '}
          <Link href="/legal/revenue-share">Chính sách chia sẻ doanh thu</Link> và không ảnh hưởng đến số tiền bạn nhận lại.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
