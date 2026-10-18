export type InstructorNavId = 'courses' | 'bundles' | 'communication' | 'revenue' | 'tools';

export interface InstructorNavItem {
  id: InstructorNavId;
  href: string;
  /** Các đường dẫn khác cũng làm sáng mục này (vd trang Live và Mã giảm giá thuộc nhóm Công cụ). */
  alsoMatches?: string[];
}

/** Các mục thanh bên Kênh giảng viên, theo thứ tự hiển thị. Nhãn lấy từ `instructor.nav.<id>`. */
export const INSTRUCTOR_NAV: InstructorNavItem[] = [
  { id: 'courses', href: '/instructor/courses' },
  { id: 'bundles', href: '/instructor/bundles' },
  { id: 'communication', href: '/instructor/communication' },
  { id: 'revenue', href: '/instructor/revenue' },
  { id: 'tools', href: '/instructor/tools', alsoMatches: ['/instructor/live', '/instructor/coupons'] },
];

/** Khớp chính xác hoặc là trang con (`/x/y` làm sáng `/x`); không dùng `startsWith` trần vì `/courses-old` sẽ khớp nhầm. */
export function isInstructorNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mục điều hướng đang mở theo đường dẫn, hoặc null nếu trang không thuộc mục nào (vd `/instructor`). */
export function activeNavItem(pathname: string): InstructorNavItem | null {
  return (
    INSTRUCTOR_NAV.find((item) =>
      [item.href, ...(item.alsoMatches ?? [])].some((href) => isInstructorNavActive(pathname, href)),
    ) ?? null
  );
}

/** Tạo khóa mới và chỉnh sửa khóa là màn hình toàn trang riêng (có thanh trên riêng), bỏ qua khung có thanh bên. */
export function isFullPageRoute(pathname: string): boolean {
  return pathname === '/instructor/courses/new' || /^\/instructor\/courses\/\d+\/edit(\/|$)/.test(pathname);
}
