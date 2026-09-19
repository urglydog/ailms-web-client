'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { SubmitChecklist } from '@/components/instructor/SubmitChecklist';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { useCategories } from '@/hooks/useCategories';
import { useMyCourseDetail, useUpdateCourse } from '@/hooks/useCourses';
import { useStartCourseThumbnailUpload } from '@/hooks/useUploadTray';
import { ApiError } from '@/lib/api/client';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';
import type { CourseLevel } from '@/types/domain';

const LEVEL_OPTIONS: Array<{ value: CourseLevel; label: string }> = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
];

/** "Thông tin cơ bản" — giao diện tham khảo Udemy "Trang đích của khóa học" (19/09/2026, tách
 * khỏi `CourseBuilderForm` cũ, KHÔNG còn trường Giá — xem `CoursePricingForm.tsx`). */
export function CourseBasicsForm({ courseId }: { courseId: number }) {
  const { data: categories } = useCategories();
  const { data: course } = useMyCourseDetail(courseId);
  const updateCourse = useUpdateCourse(courseId);
  const startThumbnailUpload = useStartCourseThumbnailUpload(courseId);
  const thumbnailTask = useUploadTrayStore((s) =>
    s.tasks.find((t) => t.targetType === 'course-thumbnail' && t.targetId === courseId),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [level, setLevel] = useState<CourseLevel>('BEGINNER');

  const initializedRef = useRef(false);
  useEffect(() => {
    if (course && !initializedRef.current) {
      setTitle(course.title);
      setDescription(course.description ?? '');
      setThumbnailUrl(course.thumbnailUrl ?? '');
      setCategoryId(course.categoryId);
      setLevel(course.level);
      initializedRef.current = true;
    }
  }, [course]);

  const handleThumbnailFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startThumbnailUpload(file, `Ảnh bìa: ${title || course?.title || ''}`, (updated) =>
      setThumbnailUrl(updated.thumbnailUrl ?? ''),
    );
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId || !course) return;
    updateCourse.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      categoryId: Number(categoryId),
      level,
      price: course.price,
    });
  };

  if (!course) return null;

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {updateCourse.error instanceof ApiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
            {updateCourse.error.message}
          </div>
        )}
        <Field label="Tiêu đề khóa học">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </Field>
        <Field label="Mô tả">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </Field>
        <Field label="Ảnh bìa">
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="Xem trước ảnh bìa" className="h-28 w-full rounded-lg object-cover" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailFileChange}
            disabled={thumbnailTask?.status === 'uploading'}
            className="text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
          />
          {thumbnailTask?.status === 'uploading' && (
            <UploadProgressBar percent={thumbnailTask.percent} label="Đang tải ảnh bìa lên..." />
          )}
          {thumbnailTask?.status === 'error' && <p className="text-[11.5px] text-red-600">{thumbnailTask.errorMessage}</p>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Danh mục">
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
          </Field>
          <Field label="Trình độ">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseLevel)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="submit"
          disabled={updateCourse.isPending}
          className="self-start rounded-full bg-gray-900 px-6 py-3 text-[13.5px] font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {updateCourse.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <SubmitChecklist missingConditions={course.missingConditions} canSubmit={course.canSubmit} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}
