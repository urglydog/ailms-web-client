/** Tên hiển thị của một mã ngôn ngữ BCP-47 theo ngôn ngữ giao diện đang dùng — dùng API chuẩn
 * của trình duyệt thay vì tự liệt kê bảng tên (BR-DUB-07 cấm hardcode danh sách ngôn ngữ). */
export function languageDisplayName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
