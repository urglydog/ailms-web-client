/** Helper dùng chung cho khu "Hiệu suất" Giảng viên (29/09/2026) — tổng hợp dữ liệu ở tầng
 * Frontend cho biểu đồ/insight, không cần thêm endpoint Backend nào. */

/** Điền 0 cho các ngày không có trong `valueByDay` — recharts nối thẳng 1 đường chéo giữa 2 điểm
 * xa nhau nếu thiếu ngày ở giữa, khiến biểu đồ xu hướng trông sai lệch hẳn so với thực tế (ngày
 * không phát sinh doanh thu phải tụt về 0, không phải "không tồn tại"). `from`/`to` dạng
 * `YYYY-MM-DD`. */
export function fillMissingDays(
  valueByDay: Map<string, number>,
  from: string,
  to: string,
): { day: string; value: number }[] {
  const result: { day: string; value: number }[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    result.push({ day, value: valueByDay.get(day) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** Như {@link fillMissingDays} nhưng cho NHIỀU cột số cùng lúc (vd doanh thu Tự tìm thấy/Giới
 * thiệu xếp chồng theo ngày) — dùng chung 1 vòng lặp ngày thay vì gọi `fillMissingDays` nhiều lần
 * cho từng cột (mỗi lần gọi lại tạo mảng ngày riêng, dễ lệch thứ tự giữa các cột). */
export function fillMissingDaysMulti<K extends string>(
  valuesByDay: Map<string, Record<K, number>>,
  keys: K[],
  from: string,
  to: string,
): ({ day: string } & Record<K, number>)[] {
  const zero = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const result: ({ day: string } & Record<K, number>)[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    result.push({ day, ...(valuesByDay.get(day) ?? zero) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** "2026-09-30" -> "30/09" — nhãn trục X gọn cho chart, tránh hiện nguyên chuỗi ISO. */
export function formatShortDate(isoDay: string): string {
  const [, month, day] = isoDay.split('-');
  return `${day}/${month}`;
}

/** So sánh 2 kỳ, tránh chia cho 0 ra "Infinity%"/"NaN%" (kỳ trước = 0 là trường hợp bình thường
 * với giảng viên mới mở bán, không phải lỗi). */
export function describeGrowth(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? 'Bắt đầu có doanh thu trong kỳ này' : 'Chưa có phát sinh doanh thu';
  }
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.abs(percent).toFixed(0);
  if (percent === 0) return 'Doanh thu không đổi so với kỳ trước';
  return percent > 0 ? `Doanh thu tăng ${rounded}% so với kỳ trước` : `Doanh thu giảm ${rounded}% so với kỳ trước`;
}
