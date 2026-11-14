/** Kiểu dữ liệu thu nhập / tài khoản nhận tiền / rút tiền (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn C). */

export type PayoutStatus = 'PENDING_EMAIL' | 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'FAILED';
export type PayoutAccountStatus = 'PENDING_CONFIRM' | 'ACTIVE' | 'REPLACED' | 'REMOVED';
export type NameMatchStatus = 'MATCHED' | 'MISMATCH';
export type LedgerEntryType = 'EARNING' | 'REFUND_REVERSAL' | 'PAYOUT_RESERVE' | 'PAYOUT_RELEASE' | 'ADJUSTMENT';

export interface PayoutBank {
  code: string;
  name: string;
}

/** Không bao giờ có số tài khoản đầy đủ — chỉ `accountMask` (4 số cuối). */
export interface PayoutAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountMask: string;
  holderName: string;
  status: PayoutAccountStatus;
  nameMatchStatus: NameMatchStatus;
  usableFrom: string | null;
  confirmedAt: string | null;
  /** Tài khoản mặc định dùng để rút. */
  primary: boolean;
  /** Có giá trị = bản chờ xác nhận do sửa tài khoản có id này. */
  replacesAccountId: number | null;
}

export interface LinkPayoutAccountReq {
  bankCode: string;
  accountNumber: string;
  holderName: string;
}

/** Sửa tài khoản: `accountNumber` bỏ trống = giữ số cũ. Đổi ngân hàng/số cần xác nhận email, đổi tên chủ thì không. */
export interface EditPayoutAccountReq {
  bankCode: string;
  accountNumber?: string;
  holderName: string;
}

/** Tối đa 5 tài khoản nhận tiền mỗi giảng viên (khớp BE). */
export const MAX_PAYOUT_ACCOUNTS = 5;

export interface FinanceSummary {
  /** Số dư đã hết thời gian giữ (có thể âm nếu từng bị trừ sau khi đã chi). */
  available: number;
  /** Đang trong thời gian giữ (chưa rút được). */
  pending: number;
  /** Thu nhập của đơn đang có khiếu nại mở. */
  frozen: number;
  /** Số tối đa rút được ngay = max(0, available - frozen). */
  withdrawable: number;
  paidOut: number;
  minPayoutAmount: number;
  nextPayoutDate: string;
  account: PayoutAccount | null;
  /** false = máy chủ chưa cấu hình khóa mã hóa → chưa liên kết/rút tiền được. */
  cryptoConfigured: boolean;
  hasOpenPayout: boolean;
}

export interface LedgerEntry {
  id: number;
  type: LedgerEntryType;
  amount: number;
  availableAt: string;
  matured: boolean;
  note: string | null;
  createdAt: string;
}

export interface PayoutRequest {
  id: number;
  code: string;
  amount: number;
  status: PayoutStatus;
  bankName: string;
  accountMask: string;
  holderName: string;
  scheduledFor: string | null;
  createdAt: string;
  paidAt: string | null;
  transferRef: string | null;
  rejectReason: string | null;
}

export interface AdminPayout {
  id: number;
  code: string;
  amount: number;
  status: PayoutStatus;
  instructorId: number;
  instructorName: string;
  instructorEmail: string;
  bankCode: string;
  bankName: string;
  accountMask: string;
  holderName: string;
  /** false = tên chủ tài khoản KHÔNG khớp tên giảng viên đã xác minh → kiểm tra kỹ trước khi chi. */
  nameMatches: boolean;
  scheduledFor: string | null;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  transferRef: string | null;
  proofUrl: string | null;
  rejectReason: string | null;
}

export interface AccountReveal {
  payoutId: number;
  bankName: string;
  accountNumber: string;
  holderName: string;
}

export interface ConfirmResult {
  type: 'ACCOUNT' | 'PAYOUT';
  id: number;
}

/** 1 khóa của giảng viên + mã giới thiệu + số đơn theo nguồn (trang Chia sẻ, Giai đoạn D). */
export interface CourseShare {
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  status: string;
  visibility: string;
  referralCode: string;
  /** Chỉ khóa đã xuất bản mới có link chia sẻ dùng được. */
  shareable: boolean;
  referralOrders: number;
  referralEarning: number;
  organicOrders: number;
  organicEarning: number;
}
