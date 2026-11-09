/** Nhóm hiển thị của danh mục trong menu "Khám phá": Công nghệ thông tin / Kỹ năng mềm / Lĩnh vực khác. */
export type CategoryGroup = 'it' | 'soft' | 'other';

const IT = new Set([
  'lap-trinh-web', 'khoa-hoc-du-lieu', 'tri-tue-nhan-tao', 'thiet-ke-ui-ux', 'nen-tang-lap-trinh',
  'lap-trinh-di-dong', 'devops-dam-may', 'an-toan-thong-tin', 'phat-trien-game',
]);
const SOFT = new Set(['giao-tiep-thuyet-trinh', 'lanh-dao-quan-ly', 'phat-trien-ban-than', 'ky-nang-mem']);

export const GROUP_ORDER: CategoryGroup[] = ['it', 'soft', 'other'];

export function categoryGroup(slug: string): CategoryGroup {
  if (IT.has(slug)) return 'it';
  if (SOFT.has(slug)) return 'soft';
  return 'other';
}

/** Chia danh sách thành các nhóm theo thứ tự cố định, bỏ nhóm rỗng; giữ nguyên thứ tự trong nhóm. */
export function groupCategories<T extends { slug: string }>(items: T[]): { group: CategoryGroup; items: T[] }[] {
  return GROUP_ORDER.map((group) => ({ group, items: items.filter((c) => categoryGroup(c.slug) === group) })).filter(
    (g) => g.items.length > 0,
  );
}
