/**
 * Thanh tiến trình kiểu "băng cảnh báo hiện trường" (sọc chéo di chuyển liên tục) —
 * dùng cho mọi tác vụ đang xử lý (tạo học liệu, xóa, lưu...) để người dùng biết còn
 * phải đợi, thay vì màn hình đứng im không phản hồi. Tái dùng animation `bg-scroll`
 * đã khai báo sẵn trong tailwind.config.ts.
 */
export function CautionProgressBar({
  tone = 'accent',
  className = '',
  height = 'h-2',
}: {
  tone?: 'accent' | 'warning';
  className?: string;
  height?: string;
}) {
  const stripeImage = tone === 'warning'
    ? 'repeating-linear-gradient(45deg, #F59E0B 0, #F59E0B 10px, #1C1917 10px, #1C1917 20px)'
    : 'repeating-linear-gradient(45deg, #2563EB 0, #2563EB 10px, #1D4ED8 10px, #1D4ED8 20px)';

  return (
    <div className={`w-full ${height} overflow-hidden bg-surface-hover border border-line ${className}`}>
      <div
        className="h-full w-full animate-bg-scroll"
        style={{ backgroundImage: stripeImage, backgroundSize: '28px 28px' }}
      />
    </div>
  );
}
