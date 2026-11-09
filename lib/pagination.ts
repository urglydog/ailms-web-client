/** Phần tử của thanh phân trang: số trang (đếm từ 1) hoặc dấu "…". */
export type PageItem = number | 'gap';

/**
 * Các ô hiển thị trên thanh phân trang: luôn có trang đầu, trang cuối và `siblings` trang hai bên
 * trang hiện tại; khoảng bị bỏ được thay bằng "…" (chỉ khi bỏ từ 2 trang trở lên — bỏ đúng 1 trang
 * thì hiện luôn số trang đó, vì "…" chiếm cùng chỗ mà kém rõ ràng hơn).
 */
export function pageItems(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 0) return [];
  const clamp = Math.min(Math.max(current, 1), total);
  const start = Math.max(2, clamp - siblings);
  const end = Math.min(total - 1, clamp + siblings);
  const items: PageItem[] = [1];
  if (start > 3) items.push('gap');
  else for (let p = 2; p < start; p++) items.push(p);
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 2) items.push('gap');
  else for (let p = end + 1; p < total; p++) items.push(p);
  if (total > 1) items.push(total);
  return items;
}

/** Đọc `?page=` an toàn: số nguyên ≥ 1, sai thì về trang 1. */
export function parsePageParam(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
