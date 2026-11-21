import { redirect } from 'next/navigation';

/** Hóa đơn của học viên nay nằm ngay trong Lịch sử giao dịch (mỗi giao dịch có biên lai / phiếu hoàn); đường dẫn cũ (vd từ email) chuyển về đó. */
export default function StudentInvoicesRedirectPage() {
  redirect('/payments');
}
