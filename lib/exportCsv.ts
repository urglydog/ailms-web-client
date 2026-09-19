/** Xuất CSV phía client (19/09/2026, mở rộng — giao diện tham khảo Udemy "Export") — đủ dùng
 * cho quy mô dữ liệu 1 giảng viên, không cần endpoint backend riêng. Thêm BOM (`﻿`) để Excel
 * mở tiếng Việt có dấu không bị lỗi font — lỗi kinh điển khi xuất CSV UTF-8 thuần cho Excel. */
export function exportToCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (value: string | number) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(',')),
  ];
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
