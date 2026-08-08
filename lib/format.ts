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
