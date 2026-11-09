const STORAGE_KEY = 'lms.referralCodes';

type ReferralMap = Record<number, string>;

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

/**
 * Chia doanh thu 2 mức (20/09/2026) — ghi lại mã giới thiệu đọc từ query `?ref=` NGAY lúc học
 * viên vào trang chi tiết khóa học (xem `ReferralCapture.tsx`), để dùng lại lúc "Thêm vào giỏ
 * hàng"/"Mua ngay" — việc mua có thể xảy ra ở 1 lượt ghé thăm SAU, không nhất thiết cùng lúc.
 * Không tự validate mã ở đây — BE mới là nơi so khớp thật với `Course.referralCode`
 * (`PaymentService.resolveRevenueSource`), hàm này chỉ ghi nhận "raw" giá trị đọc từ URL.
 */
export function captureReferralFromUrl(courseId: number, refParam: string | null | undefined): void {
  if (!refParam) return;
  const all = readAll();
  all[courseId] = refParam;
  writeAll(all);
}

export function getReferralCode(courseId: number): string | undefined {
  return readAll()[courseId];
}

/** Dùng lúc checkout giỏ hàng — trả về đúng entry của các khóa đang thanh toán, khớp
 * `CreateBatchPaymentReq.referralCodes` (khóa nào không có mã lưu sẵn thì không xuất hiện,
 * BE tự hiểu là ORGANIC). */
export function getReferralCodesFor(courseIds: number[]): Record<number, string> {
  const all = readAll();
  const result: Record<number, string> = {};
  for (const id of courseIds) {
    if (all[id]) result[id] = all[id];
  }
  return result;
}
