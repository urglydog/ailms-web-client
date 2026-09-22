import type { InstructorMaterial } from '@/lib/api/materials';

/**
 * Nguồn chân lý duy nhất cho nhãn trạng thái phân phối của 1 học liệu, dùng
 * chung ở mọi nơi hiển thị (tree, card, workspace header) để tránh mỗi nơi
 * suy ra label khác nhau cho cùng 1 dữ liệu.
 */
export function getMaterialDistributionBadge(mat: Pick<InstructorMaterial, 'isOfficial' | 'assignments'>) {
  const assignedCount = mat.assignments?.length ?? 0;
  if (assignedCount > 0) {
    return {
      label: assignedCount > 1 ? `✅ Official — Đang dùng ở ${assignedCount} vị trí` : '✅ Official — Đã phân phối',
      className: 'bg-emerald-100 text-emerald-700',
    };
  }
  return { label: 'Draft', className: 'bg-gray-200 text-gray-600' };
}

/** Nhãn phụ cho trạng thái xử lý sinh nội dung (AI), tách biệt khỏi Draft/Official. */
export function getMaterialProcessingBadge(status: string | undefined) {
  switch (status) {
    case 'PENDING_TRANSCRIPT':
    case 'PENDING':
      return { label: '⏳ Đang chờ xử lý', className: 'bg-amber-100 text-amber-700' };
    case 'PROCESSING':
      return { label: '⏳ Đang xử lý', className: 'bg-amber-100 text-amber-700' };
    case 'FAILED':
      return { label: '❌ Lỗi sinh nội dung', className: 'bg-red-100 text-red-700' };
    default:
      return null;
  }
}
