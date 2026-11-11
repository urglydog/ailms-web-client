const STORAGE_KEY = 'lms.referralCodes';

/** Hiệu lực của mã giới thiệu đã lưu (11/11/2026): quá 30 ngày kể từ lần bấm link gần nhất thì không còn tính là đơn qua link. */
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredReferral {
  code: string;
  /** Epoch ms của lần bấm link giới thiệu gần nhất cho khóa này. */
  capturedAt: number;
}

/** Bản cũ (trước 11/11/2026) lưu thẳng chuỗi mã, không có thời điểm — vẫn đọc được. */
type ReferralMap = Record<number, StoredReferral | string>;

function readAll(): ReferralMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReferralMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ReferralMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // best-effort — riêng tư trình duyệt/hết dung lượng không nên chặn duyệt web
  }
}

/** Chuẩn hóa 1 entry (kể cả định dạng cũ) và kiểm hạn. Entry cũ không có thời điểm được tính từ lúc đọc đầu tiên. */
function normalize(entry: StoredReferral | string | undefined, now: number): StoredReferral | null {
  if (!entry) return null;
  const stored: StoredReferral = typeof entry === 'string' ? { code: entry, capturedAt: now } : entry;
  if (!stored.code || typeof stored.capturedAt !== 'number') return null;
  return now - stored.capturedAt > REFERRAL_TTL_MS ? null : stored;
}

/**
 * Chia doanh thu 2 mức (20/09/2026) — ghi lại mã giới thiệu đọc từ query `?ref=` NGAY lúc học
 * viên vào trang chi tiết khóa học (xem `ReferralCapture.tsx`), để dùng lại lúc "Thêm vào giỏ
 * hàng"/"Mua ngay" — việc mua có thể xảy ra ở 1 lượt ghé thăm SAU, không nhất thiết cùng lúc.
 * Không tự validate mã ở đây — BE mới là nơi so khớp thật với `Course.referralCode`
 * (`PaymentService.resolveRevenueSource`), hàm này chỉ ghi nhận "raw" giá trị đọc từ URL.
 * (11/11/2026) lưu kèm thời điểm để hết hạn sau {@link REFERRAL_TTL_MS}; link mới nhất thắng (last-click).
 */
export function captureReferralFromUrl(courseId: number, refParam: string | null | undefined): void {
  if (!refParam) return;
  const all = readAll();
  all[courseId] = { code: refParam, capturedAt: Date.now() };
  writeAll(all);
}

export function getReferralCode(courseId: number): string | undefined {
  return normalize(readAll()[courseId], Date.now())?.code;
}

/** Dùng lúc checkout giỏ hàng — trả về đúng entry CÒN HẠN của các khóa đang thanh toán, khớp
 * `CreateBatchPaymentReq.referralCodes` (khóa nào không có mã lưu sẵn/đã hết hạn thì không xuất hiện,
 * BE tự hiểu là ORGANIC). */
export function getReferralCodesFor(courseIds: number[]): Record<number, string> {
  const all = readAll();
  const now = Date.now();
  const result: Record<number, string> = {};
  for (const id of courseIds) {
    const entry = normalize(all[id], now);
    if (entry) result[id] = entry.code;
  }
  return result;
}
