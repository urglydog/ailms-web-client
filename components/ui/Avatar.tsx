/* eslint-disable @next/next/no-img-element */

/**
 * (20/09/2026, tính năng mới) — avatar dùng chung cho Hỏi đáp/Tin nhắn (trước đây mỗi nơi tự vẽ
 * 1 vòng tròn chữ cái đầu riêng). Dùng `<img>` thô thay vì `next/image` vì URL đến từ B2 (ảnh
 * người dùng tự tải lên, không cố định theo domain khai báo sẵn) — cùng cách xử lý với avatar ở
 * trang Hồ sơ cá nhân.
 */
export function Avatar({
  name, avatarUrl, size = 32,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.42)) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/10 font-display font-bold text-accent"
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
