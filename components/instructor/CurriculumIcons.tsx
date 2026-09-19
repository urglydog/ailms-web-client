/** Icon dùng chung cho "Chương trình giảng dạy" (19/09/2026) — thay ký tự Unicode ✎/🗑 cũ
 * (hiển thị không đồng nhất giữa các hệ điều hành, không giống icon đường nét của Udemy) bằng
 * SVG line-icon đơn sắc, `fill="currentColor"`/`stroke="currentColor"` để đổi màu qua class cha
 * như mọi icon khác trong dự án. */

export function PencilIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function DragHandleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}

/** `expanded` xoay 180° — thay cho đổi ký tự ▾/▴, giữ nguyên 1 icon như quy ước icon trái tim/sao
 * đã dùng trong dự án (chỉ đổi thuộc tính hiển thị, không đổi hình dạng). */
export function ChevronDownIcon({ className = 'h-4 w-4', expanded = false }: { className?: string; expanded?: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
