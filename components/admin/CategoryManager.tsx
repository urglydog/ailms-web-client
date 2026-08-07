'use client';

import { useState, type FormEvent } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories';
import { ApiError } from '@/lib/api/client';
import type { Category } from '@/types/domain';

export function CategoryManager() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setErrorMessage(null);
    createCategory.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => setNewName(''),
        onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : 'Có lỗi xảy ra'),
      },
    );
  };

  const handleDelete = (category: Category) => {
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
    setErrorMessage(null);
    deleteCategory.mutate(category.id, {
      onError: (err) =>
        setErrorMessage(
          err instanceof ApiError ? err.message : 'Không xóa được danh mục này.',
        ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex gap-2.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên danh mục mới..."
          className="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="rounded-full bg-cyan-600 px-5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          + Thêm danh mục
        </button>
      </form>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{errorMessage}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Tên danh mục</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {categories?.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onSave={(name) => updateCategory.mutate({ id: category.id, input: { name } })}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
}: {
  category: Category;
  onSave: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== category.name) onSave(name.trim());
          }}
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-gray-900 focus:border-cyan-300 focus:bg-white focus:outline-none"
        />
      </td>
      <td className="px-6 py-3 text-gray-400">{category.slug}</td>
      <td className="px-6 py-3 text-right">
        <button onClick={onDelete} className="text-xs font-bold text-red-500 hover:text-red-700">
          Xóa
        </button>
      </td>
    </tr>
  );
}
