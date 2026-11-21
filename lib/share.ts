/** Tiện ích chia sẻ khóa học (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn D). Hàm thuần, không đụng DOM. */

export type ShareChannel = 'facebook' | 'x' | 'linkedin' | 'telegram' | 'email';

/**
 * Link công khai tới khóa học. Có `ref` (mã giới thiệu riêng của chủ khóa) thì học viên mua qua link được tính đơn giới thiệu
 * (BE đối chiếu mã thật — xem `PaymentService.resolveRevenueSource`). `src` chỉ để giảng viên tự phân biệt kênh khi nhìn
 * link; BE bỏ qua tham số này.
 */
export function buildShareUrl(origin: string, slug: string, opts: { ref?: string | null; channel?: string } = {}): string {
  const base = `${origin.replace(/\/$/, '')}/courses/${encodeURIComponent(slug)}`;
  const params = new URLSearchParams();
  if (opts.ref) params.set('ref', opts.ref);
  if (opts.channel) params.set('src', opts.channel);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** Địa chỉ mở hộp chia sẻ của từng mạng; `url` đã gồm `ref`/`src`. */
export function channelHref(channel: ShareChannel, url: string, title: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (channel) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case 'email':
      return `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n${url}`)}`;
  }
}

/** Web Share API chỉ có ở trình duyệt/ngữ cảnh bảo mật hỗ trợ (Safari iOS, Android Chrome có; nhiều desktop không) — luôn dò trước khi dùng. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
