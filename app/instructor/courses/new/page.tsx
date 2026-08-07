'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useCreateCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';

/**
 * Bước khởi tạo tối thiểu — chỉ hỏi 2 field bắt buộc ở tầng DB (title, categoryId) rồi
 * chuyển thẳng sang trang soạn thảo đầy đủ (`/courses/[id]/edit`, có chương & bài học).
 * Không dùng form đầy đủ ở đây để tránh cảm giác "phải tạo xong nháp mới được thêm bài".
 */
export default function NewCoursePage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createCourse = useCreateCourse();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    createCourse.mutate(
      { title: title.trim(), categoryId: Number(categoryId), price: 0 },
      { onSuccess: (created) => router.replace(`/instructor/courses/${created.id}/edit`) },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Tạo khóa học mới</h1>
      <p className="text-[13px] text-gray-500">
        Chỉ cần tiêu đề và danh mục để bắt đầu — mô tả, ảnh bìa, chương và bài học bạn sẽ điền
        ngay ở trang soạn thảo tiếp theo.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">Tiêu đề khóa học</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">Danh mục</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {createCourse.error instanceof ApiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
            {createCourse.error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={createCourse.isPending}
          className="self-start rounded-full bg-cyan-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {createCourse.isPending ? 'Đang tạo...' : 'Tạo & bắt đầu soạn thảo →'}
        </button>
      </form>
    </div>
  );
}
