import type { InstructorMaterial } from '@/lib/api/materials';

export type MaterialStatusTone = 'success' | 'neutral' | 'warning' | 'danger';

/**
 * Nguồn chân lý duy nhất cho nhãn trạng thái phân phối của 1 học liệu, dùng
 * chung ở mọi nơi hiển thị (tree, card, workspace header) để tránh mỗi nơi
 * suy ra label khác nhau cho cùng 1 dữ liệu.
 */
export function getMaterialDistributionBadge(mat: Pick<InstructorMaterial, 'isOfficial' | 'assignments'>): { label: string; tone: MaterialStatusTone } {
  const assignedCount = mat.assignments?.length ?? 0;
  if (assignedCount > 0) {
    return {
      label: assignedCount > 1 ? `Official — Đang dùng ở ${assignedCount} vị trí` : 'Official — Đã phân phối',
      tone: 'success',
    };
  }
  return { label: 'Draft', tone: 'neutral' };
}

/** Nhãn phụ cho trạng thái xử lý sinh nội dung (AI), tách biệt khỏi Draft/Official. */
export function getMaterialProcessingBadge(status: string | undefined): { label: string; tone: MaterialStatusTone } | null {
  switch (status) {
    case 'PENDING_TRANSCRIPT':
    case 'PENDING':
      return { label: 'Đang chờ xử lý', tone: 'warning' };
    case 'PROCESSING':
      return { label: 'Đang xử lý', tone: 'warning' };
    case 'FAILED':
      return { label: 'Lỗi sinh nội dung', tone: 'danger' };
    default:
      return null;
  }
}
