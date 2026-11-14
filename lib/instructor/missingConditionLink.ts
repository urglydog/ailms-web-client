/**
 * Điều kiện gửi duyệt nào có thể tự xử lý bằng 1 trang riêng thì trả về đường dẫn tới trang đó (để FE hiện nút "Làm ngay"
 * thay vì chỉ báo thiếu mà không chỉ cách làm). Hiện có BR-VERIFY-01 (xác minh định danh — nộp ở trang onboarding giảng viên) và DEBT-01 (công nợ quá hạn — trả ở trang Thu nhập).
 */
export function missingConditionHref(condition: string): string | null {
  if (condition.includes('BR-VERIFY-01')) return '/teaching/onboarding';
  // Công nợ quá hạn (DEBT-01): trả nợ ở trang Thu nhập.
  if (condition.includes('DEBT-01')) return '/instructor/earnings';
  return null;
}
