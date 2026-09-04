'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ChapterEditorList } from '@/components/instructor/ChapterEditorList';
import { CourseMaterialsManager } from '@/components/instructor/CourseMaterialsManager';
import { SubmitChecklist } from '@/components/instructor/SubmitChecklist';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { useCategories } from '@/hooks/useCategories';
import { useMyCourseDetail, useSubmitCourse, useUpdateCourse } from '@/hooks/useCourses';
import { useStartCourseThumbnailUpload } from '@/hooks/useUploadTray';
import { ApiError } from '@/lib/api/client';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';
import type { CourseLevel } from '@/types/domain';

const LEVEL_OPTIONS: Array<{ value: CourseLevel; label: string }> = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
];

interface CourseBuilderFormProps {
  courseId: number;
}

export function CourseBuilderForm({ courseId }: CourseBuilderFormProps) {
  const { data: categories } = useCategories();
  const { data: course, isLoading } = useMyCourseDetail(courseId);

  const updateCourse = useUpdateCourse(courseId);
  const submitCourse = useSubmitCourse(courseId);
  const startThumbnailUpload = useStartCourseThumbnailUpload(courseId);
  const thumbnailTask = useUploadTrayStore((s) =>
    s.tasks.find((t) => t.targetType === 'course-thumbnail' && t.targetId === courseId),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [level, setLevel] = useState<CourseLevel>('BEGINNER');
  const [price, setPrice] = useState('0');

  /**
   * Chỉ đồng bộ state form từ server ĐÚNG 1 LẦN khi dữ liệu vừa tải xong.
   * Không lặp lại ở mỗi lần refetch (vd. sau khi thêm/sửa/xoá chương-bài học —
   * các thao tác đó tự lưu ngay và invalidate query), nếu không sẽ ghi đè mất
   * nội dung form đang gõ dở mà chưa bấm "Lưu thay đổi" (bug ảnh bìa hay mất).
   */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (course && !initializedRef.current) {
      setTitle(course.title);
      setDescription(course.description ?? '');
      setThumbnailUrl(course.thumbnailUrl ?? '');
      setCategoryId(course.categoryId);
      setLevel(course.level);
      setPrice(String(course.price));
      initializedRef.current = true;
    }
  }, [course]);

  /** Hiện dấu phân cách hàng nghìn khi gõ, nhưng state `price` vẫn chỉ giữ chuỗi số thuần. */
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setPrice(digitsOnly || '0');
  };
  const priceDisplay = Number(price).toLocaleString('vi-VN');

  /** Upload ngay khi chọn file — tách khỏi nút "Lưu thay đổi" chính, giống đổi ảnh đại diện. */
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
    if (!categoryId) return;
    updateCourse.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      categoryId: Number(categoryId),
      level,
      price: Number(price) || 0,
    });
  };

  const [activeTab, setActiveTab] = useState<'content' | 'materials'>('content');

  if (isLoading || !course) {
    return <div className="p-10 text-center text-sm text-gray-500">Đang tải khóa học...</div>;
  }

  const errors = [updateCourse.error, submitCourse.error].filter(
    (e): e is ApiError => e instanceof ApiError,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Chỉnh sửa khóa học</h1>
          <CourseStatusBadge status={course.status} />
        </div>
        {(course.status === 'DRAFT' || course.status === 'REJECTED') && (
          <button
            type="button"
            disabled={!course.canSubmit || submitCourse.isPending}
            onClick={() => submitCourse.mutate()}
            title={course.canSubmit ? undefined : course.missingConditions.join('; ')}
            className="rounded-full bg-cyan-600 px-5 py-[11px] text-[13.5px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {course.status === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt'}
          </button>
        )}
      </div>

      {course.status === 'REJECTED' && course.rejectReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          <span className="font-bold">Lý do bị từ chối: </span>
          {course.rejectReason}
          {course.resubmitCount > 0 && (
            <span className="ml-2 text-red-500">(đã gửi lại {course.resubmitCount}/5 lần)</span>
          )}
        </div>
      )}

      {course.status === 'PUBLISHED' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
          Khóa học đã xuất bản — sửa tiêu đề/mô tả/giá/chương/bài học/video được áp dụng{' '}
          <span className="font-bold">ngay lập tức, không cần Admin duyệt lại</span>.
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {errors.map((e) => e.message).join(' · ')}
        </div>
      )}

      {/* Tab Navigation Bar */}
      <div className="flex border-b border-gray-200 space-x-4 bg-white p-2 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'content'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span>📝</span> Thông tin cơ bản & Bài học
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'materials'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span>🤖</span> Quản lý Học liệu Official & Quiz Thi Cử
        </button>
      </div>

      {/* Tab 1: Content & Metadata */}
      {activeTab === 'content' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[1fr_320px] gap-5">
            <form
              id="course-metadata-form"
              onSubmit={handleSave}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
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
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </Field>
              <Field label="Ảnh bìa">
                {thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt="Xem trước ảnh bìa"
                    className="h-28 w-full rounded-lg object-cover"
                  />
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
                {thumbnailTask?.status === 'error' && (
                  <p className="text-[11.5px] text-red-600">{thumbnailTask.errorMessage}</p>
                )}
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
              <Field label="Giá (đ, để 0 nếu miễn phí)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </Field>
            </form>

            <div className="flex flex-col gap-4">
              <SubmitChecklist missingConditions={course.missingConditions} canSubmit={course.canSubmit} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[16px] font-bold text-gray-900">Chương &amp; bài học</h2>
            <ChapterEditorList courseId={course.id} chapters={course.chapters} />
          </div>

          <button
            type="submit"
            form="course-metadata-form"
            disabled={updateCourse.isPending}
            className="self-start rounded-full bg-gray-900 px-6 py-3 text-[13.5px] font-bold text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {updateCourse.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}

      {/* Tab 2: AI Materials & Quiz Manager */}
      {activeTab === 'materials' && (
        <div className="flex flex-col gap-4">
          <CourseMaterialsManager courseId={course.id} />
        </div>
      )}
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
