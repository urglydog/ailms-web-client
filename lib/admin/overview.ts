/** Dung lượng dạng dễ đọc (B, KB, MB, GB, TB), tối đa 2 chữ số thập phân. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Thời gian chạy từ mili giây thành `Nd Nh Nm`; giây chỉ hiện khi chưa đủ 1 phút. */
export function formatUptime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days === 0 && hours === 0 && minutes === 0) return `${totalSeconds}s`;
  return `${days}d ${hours}h ${minutes}m`;
}

export type UsageTone = 'ok' | 'warn' | 'critical';

/** Mức cảnh báo theo tỉ lệ dùng: từ `warnAt` là cam, từ `criticalAt` là đỏ. */
export function usageTone(used: number, total: number, warnAt = 0.7, criticalAt = 0.9): UsageTone {
  if (total <= 0) return 'ok';
  const ratio = used / total;
  if (ratio >= criticalAt) return 'critical';
  if (ratio >= warnAt) return 'warn';
  return 'ok';
}

export function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}
