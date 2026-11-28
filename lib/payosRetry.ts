import type { PayosFailureCategory, PayosOrder } from '@/lib/api/payosPayout';
import { tr } from '@/lib/i18n/translate';

/** Nhãn nguyên nhân thất bại hiển thị cho admin. */
export const failureLabel = (category: PayosFailureCategory): string => tr(`errors.lib.payosFailure.${category}`);

/** Lệnh gần nhất đã thất bại và BE đang từ chối chi lại (chờ, hết lượt hoặc lỗi tài khoản). Nút chỉ phản ánh quyết định của BE. */
export function isRetryBlocked(o: PayosOrder | undefined): boolean {
  return !!o && o.status === 'FAILED' && o.canRetry === false;
}

/** Làm mới định kỳ khi đang bị chặn theo thời gian để nút tự mở lại đúng lúc; null khi không cần. */
export const BLOCKED_REFRESH_MS = 30_000;

/** Giờ:phút theo múi giờ trình duyệt, ví dụ "14:35". */
export function clockTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Chữ trên nút chi lại: cho biết bao giờ được chi lại, hoặc đã khóa hẳn. */
export function retryButtonLabel(o: PayosOrder | undefined): string | null {
  if (!isRetryBlocked(o) || !o) return null;
  const at = clockTime(o.nextRetryAt);
  if (at) return tr('errors.lib.retryAfter', { time: at });
  return tr('errors.lib.payosLocked');
}
