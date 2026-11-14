/**
 * Điều kiện gửi duyệt nào có thể tự xử lý bằng 1 trang riêng thì trả về đường dẫn tới trang đó (để FE hiện nút "Làm ngay"
 * thay vì chỉ báo thiếu mà không chỉ cách làm). Hiện chỉ có BR-VERIFY-01 (xác minh định danh) — nộp ở trang onboarding giảng viên.
 */
export function missingConditionHref(condition: string): string | null {
  return condition.includes('BR-VERIFY-01') ? '/teaching/onboarding' : null;
}
