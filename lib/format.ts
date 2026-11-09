/** `mm:ss`, hoặc `--:--` khi chưa có thời lượng (chưa nạp video). */
export function formatDuration(sec: number | null | undefined): string {
  if (!sec) return '--:--';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** KB dưới 1MB, MB (1 số thập phân) từ 1MB trở lên. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tiền VNĐ kiểu "1.500.000đ" — dùng chung cho khu "Hiệu suất" Giảng viên (29/09/2026, tách ra
 * từ chỗ mỗi trang tự định nghĩa lại giống hệt nhau ở `revenue/page.tsx`/`revenue/list/page.tsx`). */
export function formatMoney(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}
