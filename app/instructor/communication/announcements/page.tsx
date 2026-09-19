'use client';

import { useState } from 'react';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useCreateAnnouncement, useDeleteAnnouncement, useInstructorAnnouncements } from '@/hooks/useCommunication';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { InstructorCourseOption } from '@/lib/api/dashboard';

/** "Giao tiếp > Thông báo" (19/09/2026, xây mới) — gửi broadcast tới toàn bộ học viên đã ghi
 * danh 1 khóa (fan-out qua hệ thống Notification có sẵn). */
export default function InstructorAnnouncementsPage() {
  const [filterCourseId, setFilterCourseId] = useState<number | ''>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: courses } = useInstructorCourseOptions();
  const { data: announcements, isLoading } = useInstructorAnnouncements(filterCourseId || undefined);
  const deleteAnnouncement = useDeleteAnnouncement();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-gray-900">Thông báo</h1>
        <CourseFilterDropdown courses={courses ?? []} value={filterCourseId} onChange={setFilterCourseId} />
      </div>

      <CreateAnnouncementForm courses={courses ?? []} />

      {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}
      {!isLoading && (!announcements || announcements.length === 0) && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Chưa có thông báo nào.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {announcements?.map((a) => (
          <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-bold text-gray-900">{a.title}</p>
                <p className="text-[11.5px] text-gray-400">{a.courseTitle} · {new Date(a.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteId(a.id)}
                className="shrink-0 text-[12px] font-semibold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
            <p className="whitespace-pre-line text-[13px] text-gray-700">{a.content}</p>
          </div>
        ))}
      </div>

      {deleteId != null && (
        <ConfirmModal
          title="Xóa thông báo"
          message="Bạn có chắc chắn muốn xóa thông báo này? Học viên đã nhận sẽ vẫn giữ thông báo trong hộp thư của họ."
          confirmLabel="Xóa"
          onCancel={() => setDeleteId(null)}
          onConfirm={() => { deleteAnnouncement.mutate(deleteId); setDeleteId(null); }}
        />
      )}
    </>
  );
}

function CreateAnnouncementForm({ courses }: { courses: InstructorCourseOption[] }) {
  const [courseId, setCourseId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const createAnnouncement = useCreateAnnouncement();

  const handleSubmit = () => {
    if (!courseId || !title.trim() || !content.trim()) return;
    createAnnouncement.mutate(
      { courseId: Number(courseId), title: title.trim(), content: content.trim() },
      { onSuccess: () => { setTitle(''); setContent(''); } },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="font-display text-[14px] font-bold text-gray-900">Gửi thông báo mới</p>
      <CourseFilterDropdown
        courses={courses}
        value={courseId}
        onChange={setCourseId}
        allLabel="Chọn khóa học..."
        showAllOption={false}
        fullWidth
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề thông báo"
        className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Nội dung thông báo gửi tới toàn bộ học viên đã ghi danh khóa học này..."
        className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!courseId || !title.trim() || !content.trim() || createAnnouncement.isPending}
        className="self-end rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Gửi thông báo
      </button>
    </div>
  );
}
