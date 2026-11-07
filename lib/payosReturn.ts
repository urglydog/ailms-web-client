/**
 * Luồng hủy thanh toán PayOS: lịch sử trình duyệt là [Checkout] → [PayOS] → [Callback hủy]. Back từ
 * callback rơi vào trang PayOS "Đơn hàng không tồn tại" (trang của PayOS, không có nút nào). Lúc bấm
 * thanh toán ta ghi lại trang Checkout + số bước lịch sử; callback hủy dùng nó để nhảy THẲNG về
 * Checkout, bỏ qua trang PayOS. Mọi thao tác bọc try/catch — sessionStorage có thể bị chặn.
 */
const KEY = 'payos_return';
const NOTICE_KEY = 'payos_cancelled_notice';

export function rememberPayosReturn(): void {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ url: window.location.pathname + window.location.search, historyLength: window.history.length }),
    );
  } catch {}
}

/** Đọc và xoá dấu đã ghi lúc bấm thanh toán; null nếu không có. */
export function takePayosReturn(): { url: string; historyLength: number } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url?: unknown; historyLength?: unknown };
    if (typeof parsed.url !== 'string' || !parsed.url.startsWith('/') || typeof parsed.historyLength !== 'number') return null;
    return { url: parsed.url, historyLength: parsed.historyLength };
  } catch {
    return null;
  }
}

/** Callback hủy gọi trước khi rời trang; trang Checkout đọc lại để hiện toast "Đã hủy thanh toán". */
export function flagPayosCancelledNotice(): void {
  try { sessionStorage.setItem(NOTICE_KEY, '1'); } catch {}
}

export function takePayosCancelledNotice(): boolean {
  try {
    const v = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}
