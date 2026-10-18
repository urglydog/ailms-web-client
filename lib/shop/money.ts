/** Giá hiển thị theo ngôn ngữ giao diện, đơn vị đồng (ví dụ 199.000đ). */
export function formatMoney(amount: number, locale: string): string {
  return `${amount.toLocaleString(locale)}đ`;
}
