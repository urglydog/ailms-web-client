import { CategoryManager } from '@/components/admin/CategoryManager';

export default function AdminCategoriesPage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Quản lý danh mục</h1>
      <CategoryManager />
    </>
  );
}
