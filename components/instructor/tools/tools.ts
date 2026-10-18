import { PackageIcon, TagIcon, VideoIcon } from '@/components/instructor/SidebarIcons';

export type ToolId = 'live' | 'coupons' | 'bundles';

export interface ToolDef {
  id: ToolId;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

/** Các công cụ của giảng viên hiện ở trang "Công cụ". Tên và mô tả lấy từ `instructor.tools.items.<id>`.
 * (Kho Học Liệu & Đề Thi chỉ nằm trong trình chỉnh sửa khóa, tab "Học liệu & Quiz thi cử", nên không có ở đây.) */
export const TOOLS: ToolDef[] = [
  { id: 'live', href: '/instructor/live', icon: VideoIcon },
  { id: 'coupons', href: '/instructor/coupons', icon: TagIcon },
  { id: 'bundles', href: '/instructor/bundles', icon: PackageIcon },
];
