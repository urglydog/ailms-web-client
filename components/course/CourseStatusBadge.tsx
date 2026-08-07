import type { CourseStatus } from '@/types/domain';

const STATUS_META: Record<CourseStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Đã xuất bản', className: 'bg-green-50 text-green-600' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-red-50 text-red-600' },
  ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-slate-100 text-slate-500' },
};

/** Pill màu trạng thái khóa học — dùng chung ở cả trang Instructor lẫn Admin. */
export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
